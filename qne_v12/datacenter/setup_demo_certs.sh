#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
umask 077
mkdir -p secrets
if [ -e secrets/cluster_token ] || [ -e secrets/ca.key ]; then
  echo 'Secrets preexistants : REFUS de les remplacer' >&2
  exit 2
fi
command -v openssl >/dev/null 2>&1 || { echo 'OpenSSL requis' >&2; exit 2; }
openssl rand -hex 48 > secrets/cluster_token
openssl req -x509 -newkey rsa:3072 -noenc -keyout secrets/ca.key -out secrets/ca.crt -days 2 -subj '/CN=QNE Demo Internal CA' >/dev/null 2>&1
openssl req -newkey rsa:3072 -noenc -keyout secrets/server.key -out secrets/server.csr -subj '/CN=coordinator' >/dev/null 2>&1
printf '%s\n' 'subjectAltName = DNS:coordinator' 'extendedKeyUsage = serverAuth' > secrets/leaf.ext
openssl x509 -req -in secrets/server.csr -CA secrets/ca.crt -CAkey secrets/ca.key -CAcreateserial -out secrets/server.crt -days 2 -sha256 -extfile secrets/leaf.ext >/dev/null 2>&1
chmod 600 secrets/*
echo 'Certificats DEMONSTRATION generes, valides 2 jours; ne pas les exposer sur Internet.'
