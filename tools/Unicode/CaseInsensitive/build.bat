@echo off

REM npm install
REM npm install -g typings
REM typings install --global env~node

tsc mappings.ts -target es6 -module commonjs

REM node mappings.js ../UCD/UnicodeData-8.0.0.txt ../UCD/CaseFolding-8.0.0.txt ./out/mappings-8.0.0.txt >NUL
REM node mappings.js ../UCD/UnicodeData-9.0.0.txt ../UCD/CaseFolding-9.0.0.txt ./out/mappings-9.0.0.txt >NUL
