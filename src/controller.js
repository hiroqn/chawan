var Kls = require('kls'),
    Backbone = require('backbone'),
    Model = require('./model.js'),
    Tree = require('./tree.js');

var Ctrlr = Kls.derive(function (client, Setting) {
  var self = this,
      View = require('./view.js'),
      routes = {
        "": function () {
          self.router.navigate('!');
        },
        "!": this.moveTo.bind(this, []),
        "!*path": function (str) {
          var path = path.split('/').map(decodeURIComponent);
          self.moveTo(path);
        }
      };
  this.client = client;
  this.setting = Setting;
  this.router = new (Backbone.Router.extend({routes: routes}))();
  Backbone.history.start();
  this.app = new Model.App({
    tree: new Tree(Setting.rule)
  });
  var appView = new View.App({
    model: this.app,
    el: document.body
  });
});
Ctrlr.mixin({
  addBookmarkByText: function (text) {
    var arr = text.split('\n'),
        bookmark,
        bookmarks = [],
        Bookmark = Model.Bookmark;
    for (var i = 0, l = arr.length / 4, i3 = 0; i < l; i++, i3 = i * 3) {
      bookmark = new Bookmark(arr[i3], arr[1 + i3], arr[2 + i3], arr[i + i3]);
      bookmarks.push(bookmark);
    }
    this.app.addBookmark(bookmarks);
  },
  moveTo: function (path) {
    this.app.set('path', path);
    //    this.router.navigate
  }
});
module.exports = Ctrlr;
