var Kls = require('kls'),
    _ = require('underscore');

var counter = 0,
    tagParam = /\[[^%\/\?\[\]]+?\]/g;
var Bookmark = Kls.derive(function (title, comment, url,
    other) {
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
  addFolder: function (folder) {
    this.folders.push(folder);
    return folder;
  },
  addBookmark: function (bookmark) {
    this.bookmarks.push(bookmark);
  },
  makeFolder: function (name) {
    var folder = new Folder(name);
    this.folders.push(folder);
    return folder;
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
  sortFolder: function () {
    this.folders = _(this.folders).sortBy(function (folder) {
      return folder.name.charCodeAt(0);
    });
  },
  setBookmarkCount: function () {
    var folders = this.folders;
    return this.count = folders.reduce(function (memo, folder) {
      return folder.setBookmarkCount() + memo;
    }, this.bookmarks.length);
  }
});
function checkCondition(tags, condition) {
  var or = false, and = true;
  for (var k = condition.length - 1; k >= 0; k--) {
    and = true;
    for (var j = condition[k].length - 1; j >= 0; j--) {
      if (tags.indexOf(condition[k][j]) === -1) {
        and = false;
        break;
      }
    }
    if (and) {
      or = true;
      break;
    }
  }
  return or;
}
var Tree = module.exports = Kls.derive(function (configs) {
  this.root = new Folder('root');
  this.allBookmarks = [];
  this.rule = configs;
});
Tree.mixin({
  findFolder: function (path) {
    var folder = this.root;
    if (path.length === 0) {
      return folder;
    }
    for (var i = 0; i < path.length; i++) {
      folder = folder.getFolder(path[i]);
      if (!folder) {
        return null;
      }
    }
    return folder;
  },
  addBookmarks: function (bookmarkArray) {
    this.allBookmarks = this.allBookmarks.concat(bookmarkArray);
    //    this.classifyFolder(conditions, this.root, bookmarkArray);
    //    this.setBookmarkCount(this.root);
    this.classify(this.rule, this.root, bookmarkArray)
    this.root.setBookmarkCount();
    this.sortAllFolder(this.root);
  },
  sortAllFolder: function sortFolder(folder) {
    folder.folders.forEach(function (folder) {
      sortFolder(folder);
      folder.sortFolder();
    });
  },
  classify: function (configs, folder, bookmarks) {
    var copied = bookmarks.slice(0);
    configs.forEach(function (config) {
      var name = config.name,
          fldr = folder.getFolder(name) || folder.makeFolder(name);
      copied.forEach(function (bookmark) {
        if (checkCondition(bookmark.tags, config.condition)) {
          fldr.addBookmark(bookmark);
          var index = bookmarks.indexOf(bookmark);
          if (~index) {
            bookmarks.splice(index, 1);
          }
        }
      });
      this.classify(config.children, fldr, fldr.bookmarks);
    }, this);
  }
});
Tree.Bookmark = Bookmark;
Tree.Folder = Folder;