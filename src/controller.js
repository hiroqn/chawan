var Kls = require('kls'),
    Backbone = require('backbone'),
    HatenaClient = require('./hatena_client.js'),
    View = require('./view.js'),
    Model = require('./model.js'),
    Tree = require('./tree.js');

var Ctrlr = Kls.derive(function (config) {
  var self = this,
      Router = Backbone.Router.extend({
        routes: {
          "": 'path',
          "!": 'path',
          "!*path": 'path'
        },
        path: function (str) {
          if (!str) {
            return self.moveTo([]);
          }
          var path = str.split('/').map(decodeURIComponent);
          self.moveTo(path);
        }
      });
  this.client = new HatenaClient(config.name, config.rks);
  this.getBookmarks();
  this.setting = config;
  this.app = new Model.App({
    tree: new Tree(config.rule)
  });
  var appView = new View.App({
    model: this.app,
    el: document.body
  });
  appView.on('submit:edit', this.editComment, this);
  appView.on('submit:remove', this.removeBookmark, this);
  this.router = new Router();
  Backbone.history.start();
});
Ctrlr.mixin({
  addBookmarkByText: function (text) {
    var arr = text.split('\n'),
        bookmark,
        bookmarks = [],
        Bookmark = Tree.Bookmark;
    for (var i = 0, l = arr.length / 4, i3 = 0; i < l; i++, i3 = i * 3) {
      bookmark = new Bookmark(arr[i3], arr[1 + i3], arr[2 + i3], arr[i + i3]);
      bookmarks.push(bookmark);
    }
    this.app.addBookmark(bookmarks);
  },
  moveTo: function (path) {
    this.app.set('path', path);
  },
  editComment: function (bookmark, comment) {
    var app = this.app;
    this.client.editComment(bookmark.url, comment)
        .then(function (json) {//success
          bookmark.updateComment(comment);
          app.refreshTree();
          console.log('update comment');
        }, function () {});
  },
  removeBookmark: function (bookmark) {
    this.client.deleteBookmark(bookmark.url)
        .then(function (json) {//success
          app.removeBookmark(bookmark);
          console.log('delete bookmark');
        }, function () {});
  },
  getBookmarks: function () {
    var self = this;
    this.client.searchData().then(function (text) {
      self.addBookmarkByText(text);//todo if over 1000 bookmarks
    })
  }
});
module.exports = Ctrlr;
