var fs = require('fs'),
  pack = JSON.parse(fs.readFileSync(__dirname+"/pack.json").toString()),
  chawan = fs.readFileSync(__dirname+"/chawan.js").toString();

var metaStr = '', lf = '\n';
metaStr += '// ==UserScript==' + lf;

metaStr += '// ==/UserScript==' + lf;
fs.writeFileSync();