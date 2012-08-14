var file = require('./file.js'),
    _ = require('underscore');
module.exports = {
  bookmarks: _.template(file.bookmark),
  folders: _.template(file.folder),
  nav: _.template(file.nav),
  config: _.template(file.config),
  editor: _.template(file.editor)
};
