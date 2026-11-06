#include <stdio.h>
#include <stdint.h>
#include <time.h>
#include <wmmintrin.h>
#include <emmintrin.h>
static void mul_ref(uint64_t a0,uint64_t a1,uint64_t b0,uint64_t b1,uint64_t*r0,uint64_t*r1){
  uint64_t R0=0,R1=0;
  for(int i=0;i<128;i++){
    int bit=(i<64)?((b0>>i)&1):((b1>>(i-64))&1);
    if(bit){R0^=a0;R1^=a1;}
    uint64_t of=(a1>>63)&1; a1=(a1<<1)|(a0>>63); a0=a0<<1; if(of)a0^=0x87;
  }
  *r0=R0;*r1=R1;
}
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
static void unpack(__m128i v,uint64_t*lo,uint64_t*hi){uint64_t t[2];_mm_storeu_si128((__m128i*)t,v);*lo=t[0];*hi=t[1];}
int main(){
  uint64_t s=0x243f6a8885a308d3ULL; int bad=0;
  for(int n=0;n<200000;n++){
    s=s*6364136223846793005ULL+1442695040888963407ULL; uint64_t a0=s;
    s=s*6364136223846793005ULL+1442695040888963407ULL; uint64_t a1=s;
    s=s*6364136223846793005ULL+1442695040888963407ULL; uint64_t b0=s;
    s=s*6364136223846793005ULL+1442695040888963407ULL; uint64_t b1=s;
    uint64_t r0,r1; mul_ref(a0,a1,b0,b1,&r0,&r1);
    uint64_t h0,h1; unpack(gfmul(_mm_set_epi64x(a1,a0),_mm_set_epi64x(b1,b0)),&h0,&h1);
    if(h0!=r0||h1!=r1)bad++;
  }
  printf("correctness HW vs reference QNE : %s (%d erreurs)\n",bad?"ECHEC":"OK",bad);
  uint64_t w0,w1; unpack(gfmul(_mm_set_epi64x(0x0123456789abcdefULL,0xfedcba9876543210ULL),_mm_set_epi64x(0x1111111111111111ULL,0x2222222222222222ULL)),&w0,&w1);
  printf("temoin = 0x%016llx%016llx  (doit etre 0x18f902e72ccd36d4a7649358cf0cfb37)\n",(unsigned long long)w1,(unsigned long long)w0);
  long N=50000000L;
  __m128i x=_mm_set_epi64x(0x9e3779b97f4a7c15ULL,0xf39cc0605cedc835ULL),y=_mm_set_epi64x(0xc2b2ae3d27d4eb4fULL,0x1656667213edc835ULL);
  struct timespec t0,t1; clock_gettime(CLOCK_MONOTONIC,&t0);
  for(long i=0;i<N;i++){x=gfmul(x,y);y=_mm_xor_si128(y,x);}
  clock_gettime(CLOCK_MONOTONIC,&t1);
  double sec=(t1.tv_sec-t0.tv_sec)+(t1.tv_nsec-t0.tv_nsec)/1e9;
  uint64_t z0,z1; unpack(x,&z0,&z1);
  printf("HW PCLMUL : %ld mul en %.3f s -> %.1f M mul/s (anti 0x%016llx)\n",N,sec,N/sec/1e6,(unsigned long long)z0);
  return 0;
}
