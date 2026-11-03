// QNE V4: Lorenz-96 RK4 C++ strict FP native backend (additive, no overwritten source).
// Compile: clang++ -std=c++17 -O3 -ffp-contract=off -fno-fast-math qne_v4_native.cpp -o qne_v4_native
// This kernel preserves JS V3 arithmetic association, same N,F,DT, and state layout.
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

class RK4 {
 public:
  size_t N;
  std::vector<double> x, acc, tmp, k;
  static constexpr double F=8.0;
  static constexpr double DT=0.01;
  const double HALF=DT/2.0;
  const double SIXTH=DT/6.0;
  explicit RK4(size_t n):N(n),x(n),acc(n),tmp(n),k(n) {
    if(n<4 || n>10000000) throw std::runtime_error("N doit etre entre 4 et 10 millions");
    for(size_t i=0;i<N;i++) x[i]=F+(static_cast<int>(i%7)-3)*0.001;
  }
  void seededFill(uint32_t s){
    for(size_t i=0;i<N;i++){
      s^=s<<13; s^=s>>17; s^=s<<5;
      x[i]=F+(static_cast<double>(s)/4294967296.0-0.5)*0.2;
    }
  }
  inline void derivative(const double* a,double* out){
    const size_t n=N;
    out[0]=(a[1]-a[n-2])*a[n-1]-a[0]+F;
    out[1]=(a[2]-a[n-1])*a[0]-a[1]+F;
    for(size_t i=2;i<n-1;i++)out[i]=(a[i+1]-a[i-2])*a[i-1]-a[i]+F;
    out[n-1]=(a[0]-a[n-3])*a[n-2]-a[n-1]+F;
  }
  void step(){
    const size_t n=N;
    double *xx=x.data(),*aa=acc.data(),*tt=tmp.data(),*kk=k.data();
    double d=(xx[1]-xx[n-2])*xx[n-1]-xx[0]+F;
    aa[0]=d; tt[0]=xx[0]+HALF*d;
    d=(xx[2]-xx[n-1])*xx[0]-xx[1]+F;
    aa[1]=d; tt[1]=xx[1]+HALF*d;
    for(size_t i=2;i<n-1;i++){
      d=(xx[i+1]-xx[i-2])*xx[i-1]-xx[i]+F;
      aa[i]=d;tt[i]=xx[i]+HALF*d;
    }
    d=(xx[0]-xx[n-3])*xx[n-2]-xx[n-1]+F;
    aa[n-1]=d;tt[n-1]=xx[n-1]+HALF*d;
    derivative(tt,kk);
    for(size_t i=0;i<n;i++){aa[i]+=2*kk[i];tt[i]=xx[i]+HALF*kk[i];}
    derivative(tt,kk);
    for(size_t i=0;i<n;i++){aa[i]+=2*kk[i];tt[i]=xx[i]+DT*kk[i];}
    // Fourth derivative and update after all tmp elements are initialized.
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
};

int main(int argc,char**argv){
  try {
    if(argc<5)throw std::runtime_error("Usage: qne_v4_native --state N steps seed | --bench N steps repetitions");
    std::string mode=argv[1];
    const size_t n=std::stoull(argv[2]);
    const int steps=std::stoi(argv[3]);
    if(n<4||n>10000000||steps<0||steps>10000000)throw std::runtime_error("N ou pas hors limites");
    if(mode=="--state") {
      const unsigned long long seed=std::stoull(argv[4]);
      if(seed>0xffffffffull)throw std::runtime_error("seed > uint32");
      RK4 t(n);
      if(seed!=0)t.seededFill(static_cast<uint32_t>(seed));
      for(int j=0;j<steps;j++)t.step();
      if(std::fwrite(t.x.data(),sizeof(double),t.N,stdout)!=t.N)throw std::runtime_error("ecriture incomplete");
    }else if(mode=="--bench"){
      const int reps=std::stoi(argv[4]);
      if(reps<1||reps>25)throw std::runtime_error("Repetitions hors limites (1-25)");
      for(int r=0;r<reps;r++){
        RK4 t(n);
        for(int j=0;j<5;j++)t.step();
        const auto a=std::chrono::steady_clock::now();
        for(int j=0;j<steps;j++)t.step();
        const auto b=std::chrono::steady_clock::now();
        const double ms=std::chrono::duration<double,std::milli>(b-a).count();
        // Prevent dead-code elimination. Checksums are independently verified in --state.
        volatile double s=t.x[0]+t.x[n/2]+t.x[n-1];
        (void)s;
        std::cout<<std::setprecision(14)<<ms<<"\n";
      }
    }else throw std::runtime_error("Mode invalide");
    return 0;
  }catch(const std::exception&e){std::cerr<<"QNE V4: "<<e.what()<<"\n";return 2;}
}
