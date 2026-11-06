#!/usr/bin/env bash
cd ~/qne || exit 1
echo "===== INIT CPU Z ====="
grep -m1 'model name' /proc/cpuinfo | sed 's/.*: /CPU  : /'
printf "Jeu Z: "; for f in pclmulqdq gfni vpclmulqdq vaes avx512f avx2 aes; do grep -qw "$f" /proc/cpuinfo && printf "%s " "$f"; done; echo
for s in cpuz worker gfbench; do
  if [ -f "$s.c" ] && { [ ! -x "./$s" ] || [ "$s.c" -nt "./$s" ]; }; then
    gcc -O3 -mpclmul -msse2 -fopenmp "$s.c" -o "$s" && echo "compile : $s OK"
  fi
done
echo
./cpuz
