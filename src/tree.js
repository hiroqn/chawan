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
var Tree = Kls.derive(function (configs) {
  this.root = new Folder('root');
  this.allBookmarks = [];
  this.configs = configs;
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
    this.root.setBookmarkCount();
  },
  sortAllFolder: function sortFolder(folder) {
    folder.folders.forEach(function (folder) {
      sortFolder(folder);
      folder.sortFolder();
    });
  },
  classify: function (configs, folder, bookmarks) {
    var copied = bookmarks.slice(0),
        i, l;
    var self = this;
    configs.forEach(function (config) {
      var name = config.name,
          fldr = folder.getFolder(name) || folder.makeFolder(name),
          checked = copied.filter(function (bookmark) {
            return checkCondition(bookmark.tags, config.condition);
          });
      this.classify(config.children, fldr, checked);
    }, this);
    for (var x = configs.length - 1; 0 <= x; x--) {
      for (l = bookmarks.length - 1; 0 <= l; l--) {
        if (checkCondition(bookmarks.tags, condition)) {
          fldr.addBookmark(copied[l]);
        }
        if (or) {
          fldr.addBookmark(copied[l]);
          if (config.exclude) {
            copied.splice(l, 1)
          }
        }
      }
      for (i = config.children.length - 1; 0 <= i; i--) {
        classify(config.children[i], fldr, fldr.bookmarks);
      }
    }
  }
});
var TreeManager = Backbone.Model.extend({
  getFolder: function (path) {
    var folder = this.root;
    if (path.length === 0) {
      return folder;
    }
    for (var i = 0; i < path.length; i++) {
      folder = folder.getFolder(path[i]) || folder.addFolder(path[i]);
    }
    return folder;
  },
  searchInFolder: function (path, searchText) {
    currentFolder = this.getFolder(path);
    var folders = _.filter(currentFolder.folders,
        function (folder) { return folder.name.indexOf(searchText) == 0});
    var bookmarks = _.filter(currentFolder.bookmarks,
        function (bookmark) {
          return bookmark.title.indexOf(searchText) == 0
        });
    this.trigger('infolder-search', folders, bookmarks);
  },
  classifyFolder: function (configs, folder, bookmarks) {
    var classify = this.classifyFolder.bind(this),
        copied = bookmarks.slice(0),
        x, i, j, k, l, fldr, config;
    for (x = configs.length - 1; 0 <= x; x--) {
      config = configs[x];
      fldr = folder.getFolder(config.name) || folder.addFolder(config.name);
      var condition = config.condition;
      for (l = copied.length - 1; 0 <= l; l--) {
        var or = false;
        for (k = condition.length - 1; 0 <= k; k--) {
          var and = true;
          for (j = condition[k].length - 1; 0 <= j; j--) {
            if (copied[l].tags.indexOf(condition[k][j]) === -1) {
              and = false;
              break;
            }
          }
          if (and) {
            or = true;
            break;
          }
        }
        if (or) {
          fldr.addBookmark(copied[l]);
          if (config.exclude) {
            copied.splice(l, 1)
          }
        }
      }
      for (i = config.children.length - 1; 0 <= i; i--) {
        classify(config.children[i], fldr, fldr.bookmarks);
      }
    }
  },

  moveBookmark: function (bookmark, comment) {//TODO delete paths
    var Tree = this;
    _(bookmark.paths).each(function (path) {
      Tree.getFolder(path).takeBookmark(bookmark);
    });
    bookmark.commentParser(comment);
    _(bookmark.paths).each(function (chawan) {
      Tree.getFolder(chawan, true).addBookmark(bookmark);
    });
    this.setBookmarkCount();
    this.sortAllFolder();
    this.trigger('change');
  }
});
