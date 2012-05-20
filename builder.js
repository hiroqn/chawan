var fs = require('fs'), //
  pack = require(__dirname + "/" + process.argv[2]);
function ws(n) {
  var a = new Array(n + 1);
  return a.join(' ');
}
var metaStr = '', crlf = '\r\n',metaStrArray=[];
metaStrArray.push ( '// ==UserScript==');
for (var hash in pack.meta) {
  if (typeof pack.meta[hash] === 'object') {
    pack.meta[hash].forEach(function (name) {
      metaStr += '// @' + hash + ws(14 - hash.length) + name + crlf;
    });
  } else {
    metaStr += '// @' + hash + ws(14 - hash.length) + pack.meta[hash] + crlf;
  }
}
metaStr += '// ==/UserScript==' + crlf + crlf;
metaStr += '// ==Resource==' + crlf;
var object = {};
for (hash in pack.TEXT) {
  object[hash] = fs.readFileSync(__dirname + "/" + pack.TEXT[hash]).toString();
}
metaStr += 'var TEXT = ' + JSON.stringify(object, undefined, 2) + ';' + crlf;
metaStr += '// ==/Resource==' + crlf + crlf;
metaStr += '// ==library==' + crlf;
pack.lib.forEach(function (path) {
  metaStr += '//' + path + crlf;
  metaStr += fs.readFileSync(__dirname + "/" + path).toString() + crlf;
});
metaStr += '// ==/library==' + crlf;
fs.writeFileSync(pack.filename, metaStr);
//console.log(metaStr);