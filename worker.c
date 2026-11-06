#include <stdio.h>
#include <stdint.h>
#include <time.h>
#include <wmmintrin.h>
#include <emmintrin.h>
#include <omp.h>
typedef unsigned __int128 u128;
static inline __m128i gfmul(__m128i a,__m128i b){
  __m128i t0=_mm_clmulepi64_si128(a,b,0x00),t1=_mm_clmulepi64_si128(a,b,0x11);
  __m128i t2=_mm_clmulepi64_si128(a,b,0x10),t3=_mm_clmulepi64_si128(a,b,0x01);
  __m128i mid=_mm_xor_si128(t2,t3);
  __m128i lo=_mm_xor_si128(t0,_mm_slli_si128(mid,8));
  __m128i hi=_mm_xor_si128(t1,_mm_srli_si128(mid,8));
  const __m128i poly=_mm_set_epi64x(0,0x87);
  __m128i A=_mm_clmulepi64_si128(hi,poly,0x00),B=_mm_clmulepi64_si128(hi,poly,0x01);
  __m128i m=_mm_xor_si128(A,_mm_slli_si128(B,8)),mhi=_mm_srli_si128(B,8);
  __m128i C=_mm_clmulepi64_si128(mhi,poly,0x00);
  return _mm_xor_si128(lo,_mm_xor_si128(m,C));
}
#define ONE _mm_set_epi64x(0,1)
static __m128i gfpow(__m128i a,u128 e){__m128i v=ONE;while(e){if(e&1)v=gfmul(v,a);e>>=1;if(e)a=gfmul(a,a);}return v;}
static __m128i geom_s(__m128i mult,u128 n){
  __m128i ap=ONE,as=_mm_setzero_si128(),bp=mult,bs=ONE;
  while(n){ if(n&1){__m128i np=gfmul(ap,bp),ns=_mm_xor_si128(as,gfmul(ap,bs));ap=np;as=ns;}
    if(n>1){__m128i ns=_mm_xor_si128(bs,gfmul(bp,bs)),np=gfmul(bp,bp);bs=ns;bp=np;} n>>=1; }
  return as;
}
static __m128i gworker(__m128i seed,__m128i g,u128 L,u128 W,u128 k){
  if(k>=L)return _mm_setzero_si128();
  u128 count=(L-1-k)/W+1;
  return gfmul(gfmul(seed,gfpow(g,k)),geom_s(gfpow(g,W),count));
}
static void pr(const char*t,__m128i v){uint64_t x[2];_mm_storeu_si128((__m128i*)x,v);printf("%s0x%016llx%016llx\n",t,(unsigned long long)x[1],(unsigned long long)x[0]);}
int main(){
  u128 L=1; for(int i=0;i<35;i++)L*=10; L/=16;
  u128 W=1; for(int i=0;i<21;i++)W*=10;
  __m128i seed=_mm_set_epi64x(0x0123456789abcdefULL,0xfedcba9876543210ULL), g=_mm_set_epi64x(0,2);
  printf("=== worker GF(2^128) natif PCLMUL : region 10^35, W=10^21 (zetta) ===\n");
  pr("  worker#0 = ",gworker(seed,g,L,W,0));
  pr("  worker#1 = ",gworker(seed,g,L,W,1));
  pr("  worker#7 = ",gworker(seed,g,L,W,7));
  printf("  (doivent egaler node : 05fc3d.. / 0bf87a.. / fe1eb0..)\n\n");
  long N=4000000L;
  { __m128i acc=_mm_setzero_si128(); struct timespec a,b; clock_gettime(CLOCK_MONOTONIC,&a);
    for(long k=0;k<N;k++) acc=_mm_xor_si128(acc,gworker(seed,g,L,W,(u128)k));
    clock_gettime(CLOCK_MONOTONIC,&b); double s=(b.tv_sec-a.tv_sec)+(b.tv_nsec-a.tv_nsec)/1e9;
    pr("  mono  XOR = ",acc); printf("  MONO  : %.0f zetta-workers/s\n\n",N/s); }
  { int T=omp_get_max_threads(); __m128i accs[128]; for(int i=0;i<T;i++)accs[i]=_mm_setzero_si128();
    struct timespec a,b; clock_gettime(CLOCK_MONOTONIC,&a);
    #pragma omp parallel
    { int id=omp_get_thread_num(); __m128i acc=_mm_setzero_si128();
      #pragma omp for
      for(long k=0;k<N;k++) acc=_mm_xor_si128(acc,gworker(seed,g,L,W,(u128)k));
      accs[id]=acc; }
    clock_gettime(CLOCK_MONOTONIC,&b); double s=(b.tv_sec-a.tv_sec)+(b.tv_nsec-a.tv_nsec)/1e9;
    __m128i tot=_mm_setzero_si128(); for(int i=0;i<T;i++)tot=_mm_xor_si128(tot,accs[i]);
    pr("  multi XOR = ",tot); printf("  MULTI (%d threads) : %.0f zetta-workers/s\n",T,N/s); }
  return 0;
}
