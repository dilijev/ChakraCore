@echo off

REM npm install
REM npm install -g typings
REM typings install --global env~node

tsc mappings.ts -target es6 -module commonjs
