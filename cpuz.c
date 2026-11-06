#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <time.h>
#include <cpuid.h>
#include <wmmintrin.h>
#include <emmintrin.h>
#include <omp.h>
typedef unsigned __int128 u128;
static volatile uint64_t SINK=0;
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
static void mulref(uint64_t a0,uint64_t a1,uint64_t b0,uint64_t b1,uint64_t*r0,uint64_t*r1){
  uint64_t R0=0,R1=0;
  for(int i=0;i<128;i++){int bit=(i<64)?((b0>>i)&1):((b1>>(i-64))&1);if(bit){R0^=a0;R1^=a1;}
    uint64_t of=(a1>>63)&1;a1=(a1<<1)|(a0>>63);a0=a0<<1;if(of)a0^=0x87;}
  *r0=R0;*r1=R1;
}
#define ONE _mm_set_epi64x(0,1)
static __m128i gfpow(__m128i a,u128 e){__m128i v=ONE;while(e){if(e&1)v=gfmul(v,a);e>>=1;if(e)a=gfmul(a,a);}return v;}
static __m128i geom_s(__m128i mult,u128 n){__m128i ap=ONE,as=_mm_setzero_si128(),bp=mult,bs=ONE;
  while(n){if(n&1){__m128i np=gfmul(ap,bp),ns=_mm_xor_si128(as,gfmul(ap,bs));ap=np;as=ns;}
    if(n>1){__m128i ns=_mm_xor_si128(bs,gfmul(bp,bs)),np=gfmul(bp,bp);bs=ns;bp=np;}n>>=1;}return as;}
static __m128i gworker(__m128i seed,__m128i g,u128 L,u128 W,u128 k){if(k>=L)return _mm_setzero_si128();
  u128 c=(L-1-k)/W+1;return gfmul(gfmul(seed,gfpow(g,k)),geom_s(gfpow(g,W),c));}
static double now(){struct timespec t;clock_gettime(CLOCK_MONOTONIC,&t);return t.tv_sec+t.tv_nsec/1e9;}
static uint64_t lo64(__m128i v){uint64_t o[2];_mm_storeu_si128((__m128i*)o,v);return o[0];}
int main(){
  const char* line="==========================================================";
  char brand[49];unsigned int r[4];
  __get_cpuid(0x80000002,&r[0],&r[1],&r[2],&r[3]);memcpy(brand,r,16);
  __get_cpuid(0x80000003,&r[0],&r[1],&r[2],&r[3]);memcpy(brand+16,r,16);
  __get_cpuid(0x80000004,&r[0],&r[1],&r[2],&r[3]);memcpy(brand+32,r,16);brand[48]=0;
  unsigned a,b,c,d;__get_cpuid(1,&a,&b,&c,&d);int pclmul=(c>>1)&1;
  unsigned a7,b7,c7,d7;__get_cpuid_count(7,0,&a7,&b7,&c7,&d7);
  int gfni=(c7>>8)&1,vaes=(c7>>9)&1,vpcl=(c7>>10)&1,avx512=(b7>>16)&1;
  uint64_t s=0x243f6a8885a308d3ULL;int bad=0;
  for(int n=0;n<100000;n++){s=s*6364136223846793005ULL+1442695040888963407ULL;uint64_t a0=s;
    s=s*6364136223846793005ULL+1442695040888963407ULL;uint64_t a1=s;s=s*6364136223846793005ULL+1442695040888963407ULL;uint64_t b0=s;
    s=s*6364136223846793005ULL+1442695040888963407ULL;uint64_t b1=s;uint64_t z0,z1;mulref(a0,a1,b0,b1,&z0,&z1);
    uint64_t o[2];_mm_storeu_si128((__m128i*)o,gfmul(_mm_set_epi64x(a1,a0),_mm_set_epi64x(b1,b0)));if(o[0]!=z0||o[1]!=z1)bad++;}
  long M=30000000L;__m128i x=_mm_set_epi64x(1,2),y=_mm_set_epi64x(3,4);
  double t=now();for(long i=0;i<M;i++){x=gfmul(x,y);y=_mm_xor_si128(y,x);}double nat=M/(now()-t)/1e6;SINK^=lo64(x);
  uint64_t p0=lo64(x),p1=1,q0=3,q1=4;long Ms=6000000L;t=now();
  for(long i=0;i<Ms;i++){uint64_t z0,z1;mulref(p0,p1,q0,q1,&z0,&z1);p0=z0;p1=z1;q0^=z0;q1^=z1;}double soft=Ms/(now()-t)/1e6;SINK^=p0;
  u128 Lc=1;for(int i=0;i<35;i++)Lc*=10;Lc/=16;u128 W=1;for(int i=0;i<21;i++)W*=10;
  __m128i seed=_mm_set_epi64x(0x0123456789abcdefULL,0xfedcba9876543210ULL),g=_mm_set_epi64x(0,2);
  long N=4000000L;
  t=now();{__m128i acc=_mm_setzero_si128();for(long k=0;k<N;k++)acc=_mm_xor_si128(acc,gworker(seed,g,Lc,W,(u128)k));SINK^=lo64(acc);}double mono=N/(now()-t)/1e6;
  int T=omp_get_max_threads();__m128i accs[128];for(int i=0;i<T;i++)accs[i]=_mm_setzero_si128();
  t=now();
  #pragma omp parallel
  {int id=omp_get_thread_num();__m128i acc=_mm_setzero_si128();
   #pragma omp for
   for(long k=0;k<N;k++)acc=_mm_xor_si128(acc,gworker(seed,g,Lc,W,(u128)k));accs[id]=acc;}
  double multi=N/(now()-t)/1e6;
  {__m128i tot=_mm_setzero_si128();for(int i=0;i<T;i++)tot=_mm_xor_si128(tot,accs[i]);SINK^=lo64(tot);}
  printf("\n%s\n            C P U   Z   --   M O T E U R   Q N E   N A T I F\n%s\n",line,line);
  printf("  Processeur : %s\n  Threads    : %d\n",brand,T);
  printf("  Jeu Z      : PCLMULQDQ[%s] GFNI[%s] VPCLMULQDQ[%s] VAES[%s] AVX512F[%s]\n",pclmul?"oui":"NON",gfni?"oui":"non",vpcl?"oui":"non",vaes?"oui":"non",avx512?"oui":"non");
  printf("----------------------------------------------------------\n");
  printf("  mul GF(2^128)  : NATIF %.0f M/s  vs logiciel pur %.1f M/s  ->  x%.0f\n",nat,soft,nat/soft);
  printf("  zetta-workers  : mono %.2f M/s   |   %d threads %.2f M/s\n",mono,T,multi);
  printf("  exactitude     : natif == reference bit pour bit : %s (%d err)\n",bad?"ECHEC":"OK",bad);
  printf("%s\n  Architecte : Rene LE CORRE   |   arithmetique QNE gravee dans le silicium.\n%s\n\n",line,line);
  return 0;
}
