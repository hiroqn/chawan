var fs = require('fs'), //
  pack = require(__dirname + "/" + process.argv[2]);
function ws(n) {
  var a = new Array(n + 1);
  return a.join(' ');
}
var metaStr = '', crlf = '\r\n',metaStrArray=[];
metaStrArray.push ('// ==UserScript==');
Object.keys(pack.meta).forEach(function(key){
  if (typeof pack.meta[key] === 'object') {
    pack.meta[key].forEach(function (name) {
      metaStrArray.push('// @' + key + ws(14 - key.length) + name);
    });
  } else {
    metaStrArray.push('// @' + key + ws(14 - key.length) + pack.meta[key] );
  }
});
metaStrArray.push('// ==/UserScript==');
metaStrArray.push('');
metaStrArray.push('// ==Resource==');
var object = {};
Object.keys(pack.TEXT).forEach(function(key){
  object[key] = fs.readFileSync(__dirname + "/" + pack.TEXT[key]).toString();
});
metaStrArray.push('var TEXT = ' + JSON.stringify(object, undefined, 2) + ';');
metaStrArray.push('// ==/Resource==');
metaStrArray.push('// ==library==');
pack.lib.forEach(function (path) {
  metaStrArray.push('//' + path );
  metaStrArray.push(fs.readFileSync(__dirname + "/" + path).toString());
});
metaStrArray.push('// ==/library==' );
fs.writeFileSync(pack.filename, metaStrArray.join(crlf));
//console.log(metaStr);