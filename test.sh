#!/bin/bash

eslint test/* core/* index.js gulpfile.babel.js config.js

babel-istanbul cover _mocha -- --compilers js:babel/register test/**/*.js --timeout 15000 --include-babel-polyfill=true