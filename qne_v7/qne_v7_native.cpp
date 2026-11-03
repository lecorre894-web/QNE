// QNE V7: persistent workers, temporal tiling RK4 (T=1,2,4); experimental additive backend.
// Preserve V4 double-precision operations and arithmetic grouping.
// Build with clang++ -O3 -std=c++17 -ffp-contract=off -fno-fast-math.
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <cstdio>
#include <cmath>
#include <vector>
#include <chrono>
#include <iostream>
#include <iomanip>
#include <stdexcept>
#include <string>
#include <algorithm>
#include <array>
#include <thread>
#include <mutex>
#include <condition_variable>

class RK4Temporal {
 public:
#ifndef QNE_SCHEDULE
#define QNE_SCHEDULE 0
#endif
#ifndef QNE_TILE
#define QNE_TILE 512
#endif
  static constexpr size_t TILE=QNE_TILE;
  static constexpr unsigned MAX_T=4;
  unsigned group=1;
  static constexpr double F=8.0;
  static constexpr double DT=0.01;
  const double HALF=DT/2.0;
  const double SIXTH=DT/6.0;
  size_t N;
  unsigned threads;
  std::vector<std::thread> pool;
  std::mutex mut;
  std::condition_variable wake, finished;
  uint64_t generation=0;
  unsigned completed=0;
  bool stopping=false;
  std::vector<double> x, next, accSmall, tmpSmall, kSmall;
  explicit RK4Temporal(size_t n, unsigned t):N(n),threads(n>=131072 ? t : 1),x(n),next(n){
    if(n<4 || n>10000000)throw std::runtime_error("N hors limites");
    for(size_t i=0;i<N;i++)x[i]=F+(static_cast<int>(i%7)-3)*0.001;
    if(threads<1||threads>8)throw std::runtime_error("threads entre 1 et 8");
    if(N<131072){accSmall.resize(N);tmpSmall.resize(N);kSmall.resize(N);}
    for(unsigned id=1;id<threads;id++)pool.emplace_back([this,id]{worker(id);});
  }
  ~RK4Temporal(){
    {std::lock_guard<std::mutex> lk(mut);stopping=true;}
    wake.notify_all();
    for(auto& t:pool)t.join();
  }
  void worker(unsigned id){
    uint64_t local=0;
    while(true){
      {std::unique_lock<std::mutex> lk(mut);
       wake.wait(lk,[&]{return stopping||generation!=local;});
       if(stopping)return;
       local=generation;
      }
      processTiles(id,group);
      {std::lock_guard<std::mutex> lk(mut);completed++;}
      finished.notify_one();
    }
  }
  void seededFill(uint32_t s){
    for(size_t i=0;i<N;i++){
      s^=s<<13;s^=s>>17;s^=s<<5;
      x[i]=F+(static_cast<double>(s)/4294967296.0-0.5)*0.2;
    }
  }
  inline void derivativeSmall(const double* a,double* out){
    const size_t n=N;
    out[0]=(a[1]-a[n-2])*a[n-1]-a[0]+F;
    out[1]=(a[2]-a[n-1])*a[0]-a[1]+F;
    for(size_t i=2;i<n-1;i++)out[i]=(a[i+1]-a[i-2])*a[i-1]-a[i]+F;
    out[n-1]=(a[0]-a[n-3])*a[n-2]-a[n-1]+F;
  }
  void stepSmall(){
    const size_t n=N;
    double* const xx=x.data(), * const aa=accSmall.data(), * const tt=tmpSmall.data(), * const kk=kSmall.data();
    double d=(xx[1]-xx[n-2])*xx[n-1]-xx[0]+F;
    aa[0]=d;tt[0]=xx[0]+HALF*d;
    d=(xx[2]-xx[n-1])*xx[0]-xx[1]+F;
    aa[1]=d;tt[1]=xx[1]+HALF*d;
    for(size_t i=2;i<n-1;i++){
      d=(xx[i+1]-xx[i-2])*xx[i-1]-xx[i]+F;
      aa[i]=d;tt[i]=xx[i]+HALF*d;
    }
    d=(xx[0]-xx[n-3])*xx[n-2]-xx[n-1]+F;
    aa[n-1]=d;tt[n-1]=xx[n-1]+HALF*d;
    derivativeSmall(tt,kk);
    for(size_t i=0;i<n;i++){aa[i]+=2*kk[i];tt[i]=xx[i]+HALF*kk[i];}
    derivativeSmall(tt,kk);
    for(size_t i=0;i<n;i++){aa[i]+=2*kk[i];tt[i]=xx[i]+DT*kk[i];}
    d=(tt[1]-tt[n-2])*tt[n-1]-tt[0]+F;
    xx[0]+=SIXTH*(aa[0]+d);
    d=(tt[2]-tt[n-1])*tt[0]-tt[1]+F;
    xx[1]+=SIXTH*(aa[1]+d);
    for(size_t i=2;i<n-1;i++){
      d=(tt[i+1]-tt[i-2])*tt[i-1]-tt[i]+F;
      xx[i]+=SIXTH*(aa[i]+d);
    }
    d=(tt[0]-tt[n-3])*tt[n-2]-tt[n-1]+F;
    xx[n-1]+=SIXTH*(aa[n-1]+d);
  }
  void processTiles(unsigned id,unsigned t){
    // For one RK4 step the dependency cone spans [-8,+4] sites.
    // Compute t consecutive exact RK4 steps in each private tile.
    // Halos shrink by 8 on the left and 4 on the right per time step.
    alignas(64) std::array<double,TILE+12*MAX_T> aBuf,bBuf,acc,t1,t2,t3;
    const size_t n=N;
    const double* const src=x.data();
    double* const dst=next.data();
#if QNE_SCHEDULE==1
    // Contiguous per-worker chunk, favor sequential RAM access and cache locality.
    const size_t totalTiles=(n+TILE-1)/TILE;
    const size_t first=(totalTiles*id)/threads, last=(totalTiles*(id+1))/threads;
    for(size_t tile=first;tile<last;tile++){
      const size_t s=tile*TILE;
#else
    for(size_t s=static_cast<size_t>(id)*TILE;s<n;s+=TILE*threads){
#endif
      const size_t b=std::min(TILE,n-s),L=b+12*t;
      const size_t left=8*t,right=4*t;
      if(s>=left && s+b+right<=n){
        std::memcpy(aBuf.data(),src+s-left,L*sizeof(double));
      }else{
        for(size_t j=0;j<L;j++){
          int64_t p=static_cast<int64_t>(s)+static_cast<int64_t>(j)-static_cast<int64_t>(left);
          const int64_t w=((p%static_cast<int64_t>(n))+static_cast<int64_t>(n))%static_cast<int64_t>(n);
          aBuf[j]=src[static_cast<size_t>(w)];
        }
      }
      double* a=aBuf.data();
      double* o=bBuf.data();
      size_t lo=0,hi=L;
      for(unsigned z=0;z<t;z++){
        for(size_t j=lo+2;j<hi-1;j++){
          const double d=(a[j+1]-a[j-2])*a[j-1]-a[j]+F;
          acc[j]=d;t1[j]=a[j]+HALF*d;
        }
        for(size_t j=lo+4;j<hi-2;j++){
          const double d=(t1[j+1]-t1[j-2])*t1[j-1]-t1[j]+F;
          acc[j]+=2*d;t2[j]=a[j]+HALF*d;
        }
        for(size_t j=lo+6;j<hi-3;j++){
          const double d=(t2[j+1]-t2[j-2])*t2[j-1]-t2[j]+F;
          acc[j]+=2*d;t3[j]=a[j]+DT*d;
        }
        for(size_t j=lo+8;j<hi-4;j++){
          const double d=(t3[j+1]-t3[j-2])*t3[j-1]-t3[j]+F;
          // V4 grouping for bitwise identity; no algebraic reassociation.
          o[j]=a[j]+SIXTH*(acc[j]+d);
        }
        lo+=8;hi-=4;
        std::swap(a,o);
      }
      // lo=8*t, hi=lo+b ; a holds completed target values.
      std::memcpy(dst+s,a+lo,b*sizeof(double));
    }
  }
  void stepGroup(unsigned t){
    if(t<1||t>MAX_T)throw std::runtime_error("temporal T hors limites");
    if(N<131072){for(unsigned z=0;z<t;z++)stepSmall();return;}
    if(threads==1){processTiles(0,t);x.swap(next);return;}
    {std::lock_guard<std::mutex> lk(mut);completed=0;group=t;generation++;}
    wake.notify_all();
    processTiles(0,t);
    {std::unique_lock<std::mutex> lk(mut);
     finished.wait(lk,[&]{return completed==threads-1;});}
    x.swap(next);
  }
  void run(int steps,unsigned temporal){
    for(int i=0;i<steps;){
      const unsigned g=std::min(temporal,static_cast<unsigned>(steps-i));
      stepGroup(g); i+=g;
    }
  }

};

int main(int argc,char**argv){
  try{
    if(argc<5)throw std::runtime_error("Usage: qne_v7_native --state N steps seed [threads] [T] | --bench N steps repetitions [threads] [T]");
    const std::string mode=argv[1];
    const size_t n=std::stoull(argv[2]);
    const int steps=std::stoi(argv[3]);
    if(n<4||n>10000000||steps<0||steps>10000000)throw std::runtime_error("N ou pas invalides");
    if(mode=="--state"){
      const unsigned long long seed=std::stoull(argv[4]);
      if(seed>0xffffffffull)throw std::runtime_error("seed > uint32");
      RK4Temporal r(n,argc>5?static_cast<unsigned>(std::stoul(argv[5])):2);if(seed)r.seededFill(static_cast<uint32_t>(seed));
      r.run(steps,argc>6?static_cast<unsigned>(std::stoul(argv[6])):2);
      if(std::fwrite(r.x.data(),sizeof(double),r.N,stdout)!=r.N)throw std::runtime_error("ecriture incomplete");
    }else if(mode=="--bench"){
      const int reps=std::stoi(argv[4]);
      if(reps<1||reps>25)throw std::runtime_error("repetitions invalides");
      for(int r=0;r<reps;r++){
        RK4Temporal t(n,argc>5?static_cast<unsigned>(std::stoul(argv[5])):2);
        t.run(5,argc>6?static_cast<unsigned>(std::stoul(argv[6])):2);
        const auto a=std::chrono::steady_clock::now();
        t.run(steps,argc>6?static_cast<unsigned>(std::stoul(argv[6])):2);
        const auto b=std::chrono::steady_clock::now();
        volatile double chk=t.x[0]+t.x[n/2]+t.x[n-1];(void)chk;
        std::cout<<std::setprecision(14)<<std::chrono::duration<double,std::milli>(b-a).count()<<"\n";
      }
    }else throw std::runtime_error("mode invalide");
    return 0;
  }catch(const std::exception &e){std::cerr<<"QNE V7: "<<e.what()<<"\n";return 2;}
}
