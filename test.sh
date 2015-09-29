#!/bin/bash

eslint test/*
eslint core/*
eslint index.js
eslint gulpfile.babel.js
eslint config.js

babel-istanbul cover _mocha -- --compilers js:babel/register test/**/*.js --timeout 15000 --include-babel-polyfill=true