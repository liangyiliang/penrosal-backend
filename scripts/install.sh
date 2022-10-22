#!/usr/bin/env bash

# install node
sudo apt-get install curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
command -v nvm
nvm install --lts # Latest stable LTS release (recommended)
node --version # node.js
npm --version # npm

# install libraries
npm install
npm install browserify

# generate independent js file
cd generator
browserify the_script.js > the_script_real.js
cd ..

# build Penrose
curl -o- -L https://yarnpkg.com/install.sh | bash
yarn --version

cd penrose
yarn
yarn build
cd packages/core
yarn
yarn build