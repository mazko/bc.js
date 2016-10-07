#!/bin/sh

set -e

for alias in 'emcc' 'emconfigure' 'emmake'; do
  alias $alias="docker run -it --rm -m 1g -v `pwd`:/home/src bc-emsdk $alias"
done
unset alias

mkdir -p emcc-build/

# https://palant.de/2016/02/05/compiling-c-to-javascript-emscripten-vs-cheerp
emcc $1 --memory-init-file 0  \
  test.c \
  -s NO_EXIT_RUNTIME=1 \
  -o ui/test.js

if [ ! -d "node_env" ]; then
  nodeenv node_env --prebuilt
fi

. node_env/bin/activate

if [ ! -d "node_modules" ]; then
  npm i acorn escodegen estraverse escope
fi
node yieldify.js ui/test.js ui/test.y.js $2

# clean global scope from asmjs vars
# cat /dev/urandom | tr -dc A-Za-z | head -c 42
{
  echo 'function test_asmjs_fn(zQsRUPhCptGxlYZRxhrSFAbFuIYlRmanoKpVccSRIr){'
  echo '\tvar Module = zQsRUPhCptGxlYZRxhrSFAbFuIYlRmanoKpVccSRIr;'
  echo '\tvar window = {};'
  echo '\tModule.preInit = function(){ Module.yld_SYSCALLS = SYSCALLS; Module.yld_pre_init(TTY, FS); };'
  sed 's/^/\t/' ui/test.y.js
  echo '}'
} > ui/test.f.y.js

# awk '/EMSCRIPTEN_START_ASM/,/EMSCRIPTEN_END_ASM/' ui/bc.js > asm.js

# stdio.h - find potential stdin calls
# grep -r '\b\(fgetc\|fgets\|fread\|getc\|getchar\|gets\|scanf\|vscanf\|fscanf\|vfscanf\|getline\)\b' --include="*.c" --include="*.h" --include="*.cc" --include="*.cpp" bc-1.06/bc

# chown -R $USER emcc-build