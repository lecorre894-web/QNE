// QNE V5 experimental: tiled strict-fp Lorenz-96 RK4 with compact halo.
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

class RK4Tiled {
 public:
#ifndef QNE_TILE
#define QNE_TILE 512
#endif
  static constexpr size_t TILE=QNE_TILE;
  static constexpr double F=8.0;
  static constexpr double DT=0.01;
  const double HALF=DT/2.0;
  const double SIXTH=DT/6.0;
  size_t N;
  std::vector<double> x, next, accSmall, tmpSmall, kSmall;
  explicit RK4Tiled(size_t n):N(n),x(n),next(n){
    if(n<4 || n>10000000)throw std::runtime_error("N hors limites");
    for(size_t i=0;i<N;i++)x[i]=F+(static_cast<int>(i%7)-3)*0.001;
    if(N<8192){accSmall.resize(N);tmpSmall.resize(N);kSmall.resize(N);}
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
  void step(){
    if(N<8192){stepSmall();return;}
    // Each tile covers B target sites; each stage narrows its halo.
    // Stage 1: [2,L-1) ; stage 2: [4,L-2) ; stage 3: [6,L-3) ; stage 4: [8,L-4).
    // Required original input: target indices [-8,+4) relative to the tile.
    alignas(64) std::array<double,TILE+12> x0, acc, t1,t2,t3;
    const size_t n=N;
    const double* const src=x.data();
    double* const dst=next.data();
    for(size_t s=0;s<n;s+=TILE){
      const size_t b=std::min(TILE,n-s), L=b+12;
      if(s>=8 && s+b+4<=n){
        std::memcpy(x0.data(),src+s-8,L*sizeof(double));
      } else {
        // Exact periodic halo, including very small N (4,5,6,7).
        for(size_t j=0;j<L;j++){
          const int64_t p=static_cast<int64_t>(s)+static_cast<int64_t>(j)-8;
          const int64_t w=((p%static_cast<int64_t>(n))+static_cast<int64_t>(n))%static_cast<int64_t>(n);
          x0[j]=src[static_cast<size_t>(w)];
        }
      }
      // k1 and first intermediate state.
      for(size_t j=2;j<L-1;j++){
        const double d=(x0[j+1]-x0[j-2])*x0[j-1]-x0[j]+F;
        acc[j]=d;
        t1[j]=x0[j]+HALF*d;
      }
      // k2 and second intermediate state.
      for(size_t j=4;j<L-2;j++){
        const double d=(t1[j+1]-t1[j-2])*t1[j-1]-t1[j]+F;
        acc[j]+=2*d;
        t2[j]=x0[j]+HALF*d;
      }
      // k3 and third intermediate state.
      for(size_t j=6;j<L-3;j++){
        const double d=(t2[j+1]-t2[j-2])*t2[j-1]-t2[j]+F;
        acc[j]+=2*d;
        t3[j]=x0[j]+DT*d;
      }
      // k4 and final state, written into a separate output buffer.
      for(size_t j=8;j<L-4;j++){
        const double d=(t3[j+1]-t3[j-2])*t3[j-1]-t3[j]+F;
        dst[s+j-8]=x0[j]+SIXTH*(acc[j]+d);
      }
    }
    x.swap(next);
  }
};

int main(int argc,char**argv){
  try{
    if(argc<5)throw std::runtime_error("Usage: qne_v5_native --state N steps seed | --bench N steps repetitions");
    const std::string mode=argv[1];
    const size_t n=std::stoull(argv[2]);
    const int steps=std::stoi(argv[3]);
    if(n<4||n>10000000||steps<0||steps>10000000)throw std::runtime_error("N ou pas invalides");
    if(mode=="--state"){
      const unsigned long long seed=std::stoull(argv[4]);
      if(seed>0xffffffffull)throw std::runtime_error("seed > uint32");
      RK4Tiled r(n);if(seed)r.seededFill(static_cast<uint32_t>(seed));
      for(int i=0;i<steps;i++)r.step();
      if(std::fwrite(r.x.data(),sizeof(double),r.N,stdout)!=r.N)throw std::runtime_error("ecriture incomplete");
    }else if(mode=="--bench"){
      const int reps=std::stoi(argv[4]);
      if(reps<1||reps>25)throw std::runtime_error("repetitions invalides");
      for(int r=0;r<reps;r++){
        RK4Tiled t(n);
        for(int i=0;i<5;i++)t.step();
        const auto a=std::chrono::steady_clock::now();
        for(int i=0;i<steps;i++)t.step();
        const auto b=std::chrono::steady_clock::now();
        volatile double chk=t.x[0]+t.x[n/2]+t.x[n-1];(void)chk;
        std::cout<<std::setprecision(14)<<std::chrono::duration<double,std::milli>(b-a).count()<<"\n";
      }
    }else throw std::runtime_error("mode invalide");
    return 0;
  }catch(const std::exception &e){std::cerr<<"QNE V5: "<<e.what()<<"\n";return 2;}
}
