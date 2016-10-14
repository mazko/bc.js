#!/bin/sh

# develop: ./build.sh
# production: ./build.sh -O3 compact

set -e

docker images | grep -q bc-emsdk || {
   echo "FROM 42ua/emsdk"
   echo "RUN apt-get install -y flex bison texinfo"
} | docker build --no-cache -t bc-emsdk -

for alias in 'emcc' 'emconfigure' 'emmake'; do
  alias $alias="docker run -it --rm -m 1g -w='/home/src/bc-1.06.95' -v `pwd`:/home/src bc-emsdk $alias"
done
unset alias

if [ ! -d "bc-1.06.95" ]; then
  curl -sL ftp://alpha.gnu.org/gnu/bc/bc-1.06.95.tar.bz2 | tar xj

  # configure

  emconfigure ./configure \
    --prefix=/home/src/emcc-build

  # git diff bc-1.06/dc/string.c > ptrdiff_t.patch.diff
  patch -p1 < ptrdiff_t.patch.diff
fi

mkdir -p emcc-build/
emmake make install CFLAGS='-DELIDE_CODE -Werror -Wno-error=incompatible-pointer-types-discards-qualifiers -Wno-error=unused-function'

cp emcc-build/bin/bc emcc-build/bc.bc

# https://palant.de/2016/02/05/compiling-c-to-javascript-emscripten-vs-cheerp
emcc $1 --memory-init-file 0 \
   ../emcc-build/bc.bc \
  -s NO_EXIT_RUNTIME=1 \
  -o ../ui/bc.js

cp emcc-build/bin/dc emcc-build/dc.bc

emcc $1 --memory-init-file 0 \
   ../emcc-build/dc.bc \
  -s NO_EXIT_RUNTIME=1 \
  -o ../ui/dc/dc.js

if [ ! -d "node_env" ]; then
  nodeenv node_env --prebuilt
fi

. node_env/bin/activate

if [ ! -d "node_modules" ]; then
  npm i acorn escodegen estraverse escope
fi

node yieldify.js ui/bc.js ui/bc.y.js $2
node yieldify.js ui/dc/dc.js ui/dc/dc.y.js $2

# clean global scope from asmjs vars
# cat /dev/urandom | tr -dc A-Za-z | head -c 42
{
  echo 'function bc_asmjs_fn(seBOALvGyRocJVLbbIUuBzkWjXAYwGQBGOfkNutiFD){'
  echo '\tvar Module = seBOALvGyRocJVLbbIUuBzkWjXAYwGQBGOfkNutiFD;'
  echo '\tvar window = {};'
  echo '\tModule.preInit = function(){ Module.yld_asm = asm; Module.yld_SYSCALLS = SYSCALLS; Module.yld_pre_init(TTY, FS); };'
  sed 's/^/\t/' ui/bc.y.js
  echo '}'
} > ui/bc.f.y.js

{
  echo 'function dc_asmjs_fn(bUyAauPnPjEOQKZkocjPfAWOLfFllQqTmAzPHjTGEF){'
  echo '\tvar Module = bUyAauPnPjEOQKZkocjPfAWOLfFllQqTmAzPHjTGEF;'
  echo '\tvar window = {};'
  echo '\tModule.preInit = function(){ Module.yld_asm = asm; Module.yld_SYSCALLS = SYSCALLS; Module.yld_pre_init(TTY, FS); };'
  sed 's/^/\t/' ui/dc/dc.y.js
  echo '}'
} > ui/dc/dc.f.y.js

# chown -R $USER emcc-build