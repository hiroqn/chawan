var Backbone = require('backbone'),
    _ = require('underscore');

var FolderModel = Backbone.Model.extend({
  initialize: function () {

  },
  filter: function (word) {
    var folder = this.get('folder');
    if (!word) {
      return folder;
    }
    var folders = _.filter(folder.folders,
        function (folder) { return ~folder.name.indexOf(word);});
    var bookmarks = _.filter(folder.bookmarks,
        function (bookmark) {return ~bookmark.title.indexOf(word);});
    return {
      folders: folders,
      bookmarks: bookmarks
    };
  }
});

exports.App = Backbone.Model.extend({
  defaults: {
    "path": [],
    "modal": false,
    "searchWord": ''
  },
  initialize: function () {
  },
  addBookmark: function (bArray) {
    this.get('tree').addBookmarks(bArray);
    this.trigger('change:tree');
  },
  getFolderModel: function () {
    var path = this.get('path');
    var folder = this.get('tree').findFolder(path);
    return new FolderModel({
      folder: folder
    });
  },
  clearWord: function () {
    this.set({searchWord: ''}, {silent: true})
  }
});
