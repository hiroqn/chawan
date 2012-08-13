var Kls = require('kls'),
    _ = require('underscore');

var counter = 0,
    tagParam = /\[[^%\/\?\[\]]+?\]/g;
var Bookmark = Kls.derive(function (title, comment, url, other) {
  this.title = title;
  this.url = url;
  this.rawComment = comment;
  var others = other.split('\t');
  this.count = others[0];
  this.date = others[1];
  this.bid = 'b' + counter++;
  this._parser(comment);
});
Bookmark.mixin({
  updateComment: function (comment) {
    this.rawComment = comment;
    this._parser(comment);
  },
  _parser: function (comment) {//TODO change

    //    this.chawans = _(comment.match(chawanParam)).map(function (str) {
    //      return str.slice(2, -1).split('/');
    //    });
    //    comment = comment.replace(chawanParam, '');
    this.tags = (comment.match(tagParam) || []).map(function (str) {
      return str.slice(1, -1);
    });
    this.comment = comment.replace(tagParam, '');
  }
});
var Folder = Kls.derive(function (name) {
  this.name = name;
  this.bookmarks = [];
  this.folders = [];
});
Folder.mixin({
  getFolder: function (name) {
    return _(this.folders).find(function (fldr) {
      return fldr.name === name;
    });
  },
  addFolder: function (name) {
    var folder = new Folder(name);
    this.folders.push(folder);
    return folder;
  },
  addBookmark: function (bookmark) {
    this.bookmarks.push(bookmark);
  },
  pickBookmark: function (bookmark) {
    var index = this.bookmarks.indexOf(bookmark);
    if (~index) {// tilde
      this.bookmarks.splice(index, 1);
      return true;
    } else {
      return false;
    }
  },
  getBookmarkByBid: function (bid) {
    return _(this.bookmarks).find(function (bookmark) {
      return bookmark.bid === bid;
    });
  },
  search: function (text) {
    var folders = _.filter(this.folders,
        function (folder) { return folder.name.indexOf(searchText) == 0});
    var bookmarks = _.filter(this.bookmarks,
        function (bookmark) {
          return bookmark.title.indexOf(searchText) == 0
        });
    return null;//???? TODO
  },
  sortFolder: function () {
    this.folders = _(this.folders).sortBy(function (folder) {
      return folder.name.charCodeAt(0);
    });
  }
});
