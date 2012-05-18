var TreeManager = new (Backbone.Model.extend({
  initialize: function () {
    var chawanParam = /\[\?([^%\/\?\[\]]+?(?:\/[^%\/\?\[\]]+?)*)\]/g, // for [?]
      tagParam = /\[[^%\/\?\[\]]+?\]/g, // for tags
      Folder, Bookmark;// Folder,Bookmark

    this.Folder = Folder = function (name) {
      this.name = name;
      this.bookmarks = [];
      this.folders = [];
    };
    _.extend(Folder.prototype, Backbone.Events, {
      getFolder: function (name) {
        return _(this.folders).find(function (obj) {
          return obj.name === name;
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
      takeBookmark: function (bookmark) {
        var index = this.bookmarks.indexOf(bookmark);
        if (~index) {// tilde
          this.bookmarks.splice(index, 1);
          return true;
        } else {
          return false;
        }
      },
      getBookmarkCount: function () {
        return this.count = _(this.folders).reduce(function (memo, folder) {
          return folder.getBookmarkCount() + memo;
        }, 0) + this.bookmarks.length;
      },
      getBookmarkByDate: function (date) {
        return _(this.bookmarks).find(function (bookmark) {
          return bookmark.date === date;
        });
      },
      sortFolder: function () {
        this.folders = _(this.folders).sortBy(function (folder) {
          return folder.name.charAt(0).charCodeAt();
        });
      }
    });
    this.Bookmark = Bookmark = function (title, comment, url, other) {
      this.title = title;
      this.url = url;
      this.commentParser(comment);
      var others = other.split('\t');
      this.count = others[0];
      this.date = others[1];
    };
    Bookmark.create = function (title, comment, url, others) {
      return new Bookmark(title, comment, url, others);
    };
    _.extend(Bookmark.prototype, {
      commentParser: function (comment) {
        this.rawComment = comment;
        this.paths = _(comment.match(chawanParam)).map(function (str) {
          return str.slice(2, -1).split('/');
        });
        comment = comment.replace(chawanParam, '');
        this.tags = comment.match(tagParam);
        this.comment = comment.replace(tagParam, '');
      }
    });
    this.root = new Folder('root');
    this.root.root = true;
  },
  getFolder: function (path, isNew) {
    var folder = this.root;
    if (path.length === 0) {
      return folder;
    }
    for (var i = 0; i < path.length; i++) {
      folder = folder.getFolder(path[i]) || (isNew && folder.addFolder(path[i]));
      if (!folder) {
        return null;
      }
    }
    return folder;
  },
  addByText: function (texts) {
    var array = texts.split('\n'), l = array.length / 4, bookmarks = new Array(l);
    var Tree = this;
    for (var i = 0; i < l; i++) {
      bookmarks[i] = this.Bookmark.create(array[i * 3], array[1 + i * 3], array[2 + i * 3], array[i + l * 3]);
    }
    this.allBookmark = bookmarks;
    _(bookmarks).each(function (bookmark) {
      if (bookmark.paths.length) {
        _(bookmark.paths).each(function (chawan) {
          Tree.getFolder(chawan, true).addBookmark(bookmark);
        });
      } else {// dont have chawan
        bookmark.paths.push([]);
        Tree.root.addBookmark(bookmark);
      }
    });
    this.setBookmarkCount();
    this.sortAllFolder();
    this.trigger('change');

  },
  setBookmarkCount: function () {
    (function (folder) {
      _(folder.folders).each(arguments.callee);
      folder.count = _(folder.folders).reduce(function (memo, folder) {
        return folder.count + memo;
      }, folder.bookmarks.length);

    })(this.root);
  },
  sortAllFolder: function () {
    (function (folder) {
      _(folder.folders).each(arguments.callee);
      folder.sortFolder();
    })(this.root);
  },
  moveBookmark: function (bookmark, comment) {
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
  },
  setComment: function (bookmark, comment) {
    var dfd = Hatena.editComment(bookmark.url, comment);
    var Tree = this;
    dfd.then(function (comment) {
      Tree.moveBookmark(bookmark, comment);
    }, function () {

    });
  }
}))();

window.app = new (Backbone.Model.extend({
  defaults: {
    'isModal': false
  },
  initialize: function () {
    this.set('path', []);
    this.set('Tree', TreeManager);
  },
  setText: function (texts) {
    this.get('Tree').addByText(texts);
  },
  upLevel: function (n) {
    (n > -1) || (n = 1);
    if (this.get('path').length) {
      for (var i = 0; i < n; i++) {
        this.get('path').pop();
      }
      this.trigger('change:path');
    }
  },
  downLevel: function (name) {
    var path = this.get('path');
    if (this.get('Tree').getFolder(path = path.concat(name))) {
      this.set('path', path);
    }
  }
}))();
//TODO create Controller

