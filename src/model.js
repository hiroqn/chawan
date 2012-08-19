var Backbone = require('backbone');

var FolderModel = Backbone.Model.extend({
  initialize: function () {

  },
  filter: function (word) {
    if(!word){
      return this.model
    }
    var folders = _.filter(this.model.folders,
        function (folder) { return ~folder.name.indexOf(word);});
    var bookmarks = _.filter(this.model.bookmarks,
        function (bookmark) {return bookmark.title.indexOf(word);});
    return {
      folders: folders,
      bookmarks:bookmarks
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
      model: folder
    });
  },
  clearWord: function () {
    this.set({searchWord: ''}, {silent: true})
  }
});
