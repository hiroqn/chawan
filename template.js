us$.modules.define('template', function (exports, require, module) {
  var file = require('file');
  module.exports = {
    bookmarks: _.template(file.bookmarksText),
    folders: _.template(file.foldersText),
    nav: _.template(file.navText),
    config: _.template(file.configText),
    editor: _.template(file.editorText)
  }
});
