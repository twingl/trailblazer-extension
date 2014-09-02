#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# Remove any existing documentation (but not directory, shell's don't usually
# like that)
if [ -d ./doc ] && [ "$(ls -A ./doc)" ]; then
  rm -r ./doc/*
fi

# Run JSDoc
node node_modules/jsdoc/jsdoc.js -c ./conf.json --verbose
cp arch.png doc/
