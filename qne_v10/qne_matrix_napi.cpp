// QNE V10: module Node-API natif, matrices 32x32 sur GF(2).
// Construire sur l'appareil; aucun binaire precompile n'est distribue.
#include <node_api.h>
#include <stdint.h>
#include <string.h>
#include <math.h>

struct Matrix { uint32_t r[32]; };
static inline Matrix identity() {
  Matrix x{};
  for (unsigned i=0;i<32;i++) x.r[i] = uint32_t(1) << i;
  return x;
}
static inline Matrix multiply(const Matrix &a,const Matrix &b) {
  Matrix c{};
  for (unsigned i=0;i<32;i++) {
    uint32_t bits=a.r[i], accum=0;
    while(bits){unsigned bit=(unsigned)__builtin_ctz(bits);accum ^= b.r[bit];bits &= bits-1;}
    c.r[i]=accum;
  }
  return c;
}
static Matrix matpow(Matrix base, uint64_t exp) {
  Matrix result=identity();
  while(exp){if(exp&1u) result=multiply(result,base); exp >>=1; if(exp) base=multiply(base,base);}
  return result;
}
static napi_value error(napi_env env,const char *message) {
  napi_throw_type_error(env,nullptr,message);
  return nullptr;
}
static napi_value power(napi_env env,napi_callback_info info){
  size_t argc=2; napi_value args[2];
  if(napi_get_cb_info(env,info,&argc,args,nullptr,nullptr)!=napi_ok || argc!=2)
    return error(env,"power(matrix Uint32Array[32], exponent entier non negatif <= 2^53-1)");
  bool typed=false; napi_typedarray_type type;
  size_t length=0,offset=0;void* raw=nullptr; napi_value ab;
  if(napi_is_typedarray(env,args[0],&typed)!=napi_ok || !typed ||
     napi_get_typedarray_info(env,args[0],&type,&length,&raw,&ab,&offset)!=napi_ok ||
     type!=napi_uint32_array || length!=32)
    return error(env,"L'argument matrix doit etre Uint32Array de longueur 32");
  napi_valuetype vt;
  if(napi_typeof(env,args[1],&vt)!=napi_ok || vt!=napi_number)
    return error(env,"L'exposant doit etre un nombre entier non negatif");
  double expd=0;
  if(napi_get_value_double(env,args[1],&expd)!=napi_ok || !isfinite(expd) ||
     expd<0 || expd>9007199254740991.0 || floor(expd)!=expd)
    return error(env,"Exposant hors de la plage exacte des nombres JavaScript");
  Matrix base{};memcpy(base.r,raw,sizeof(base.r));
  Matrix result=matpow(base,(uint64_t)expd);
  void* dest=nullptr;napi_value buf,arr;
  if(napi_create_arraybuffer(env,sizeof(result.r),&dest,&buf)!=napi_ok)return error(env,"Allocation echec");
  memcpy(dest,result.r,sizeof(result.r));
  if(napi_create_typedarray(env,napi_uint32_array,32,buf,0,&arr)!=napi_ok)return error(env,"TypedArray echec");
  return arr;
}
static napi_value init(napi_env env,napi_value exports){
  napi_value fn;
  if(napi_create_function(env,"power32",NAPI_AUTO_LENGTH,power,nullptr,&fn)!=napi_ok)return nullptr;
  if(napi_set_named_property(env,exports,"power32",fn)!=napi_ok)return nullptr;
  return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, init)
