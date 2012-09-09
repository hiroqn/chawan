var file = require('./file.js'),
    _ = require('underscore');
module.exports = {
  folder: _.template(file.folder),
  dialog: _.template(file.dialog),
  bookmarks: _.template(file.bookmark),
  nav: _.template(file.nav),
  config: _.template(file.config),
  editor: _.template(file.editor)
};
