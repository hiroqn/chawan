var fs = require('fs');
var TEXT = {
      "foldersText": "template/folder.txt",
      "bookmarksText": "template/bookmark.txt",
      "navText": "template/nav.txt",
      "configText": "template/config.txt",
      "editorText": "template/editor.txt"
    },
    object = {};
Object.keys(TEXT).forEach(function (key) {
  object[key] = fs.readFileSync(TEXT[key]).toString();
});
fs.writeFileSync("build/file.js",
    "us$.modules.define('file', function (exports, require, module) {\n" +
    "  module.exports = " +
    JSON.stringify(object, null, 2) +
    ";});\n");