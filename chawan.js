us$.modules.define('model', function (exports, require, module) {
  var chawanParam = /\[\?([^%\/\?\[\]]+?(?:\/[^%\/\?\[\]]+?)*)\]/g, // for [?]
      tagParam = /\[[^%\/\?\[\]]+?\]/g;// not %,?,/
  /**
   * @param title
   * @param comment
   * @param url
   * @param other
   * @constructor
   */
  var counter = 0;

  function Bookmark(title, comment, url, other) {
    this.title = title;
    this.rawComment = comment;
    this.url = url;
    var others = other.split('\t');
    this.count = others[0];
    this.date = others[1];
    this.bid = 'b' + counter++;
  }

  /**
   * @param title
   * @param comment
   * @param url
   * @param others
   * @return {Bookmark}
   */
  Bookmark.create = function (title, comment, url, others) {
    var b = new Bookmark(title, comment, url, others);
    b.commentParser(comment);
    return b;
  };
  _(Bookmark.prototype).extend({
    updateComment: function (comment) {
      this.rawComment = comment;
    },
    commentParser: function (comment) {//TODO change
      this.rawComment = comment;
      this.chawans = _(comment.match(chawanParam)).map(function (str) {
        return str.slice(2, -1).split('/');
      });
      comment = comment.replace(chawanParam, '');
      this.tags = (comment.match(tagParam) || []).map(function (str) {
        return str.slice(1, -1);
      });
      this.comment = comment.replace(tagParam, '');
    }
  });

  function Folder(name) {
    this.name = name;
    this.bookmarks = [];
    this.folders = [];
  }

  _(Folder.prototype).extend(Backbone.Events, {
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
    }
  });
  var TreeManager = Backbone.Model.extend({
    initialize: function () {
      this.root = new Folder('root');
      this.root.root = true;
      this.allBookmarks = [];
    },
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
        function(folder) { return folder.name.indexOf(searchText) == 0});
      var bookmarks = _.filter(currentFolder.bookmarks, 
        function(bookmark) { return bookmark.title.indexOf(searchText) == 0});
      this.trigger('infolder-search', folders, bookmarks);
    },
    addBookmarks: function (bookmarkArray) {
      this.allBookmarks = this.allBookmarks.concat(bookmarkArray);
      var conditions = this.get('config').folder;
      this.classifyFolder(conditions, this.root, bookmarkArray);
      this.setBookmarkCount(this.root);
      this.trigger('change');
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
          classify(cond.children[i], fldr, fldr.bookmarks);
        }
      }
    },
    setBookmarkCount: function setCount(folder) {
      var folders = folder.folders;
      folders.forEach(setCount);
      folder.count = folders.reduce(function (memo, folder) {
        return folder.count + memo;
      }, folder.bookmarks.length);
    },
    sortAllFolder: function sortFolder(folder) {
      folder.folders.forEach(function(folder){
        sortFolder(folder);
        folder.sortFolder();
      });
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
    },
    setComment: function (bookmark, comment) { //TODO c
      var dfd = Hatena.editComment(bookmark.url, comment);
      var Tree = this;
      dfd.then(function (comment) {
        Tree.moveBookmark(bookmark, comment);
      }, function () {

      });
    }
  });
  var App = Backbone.Model.extend({
    defaults: {
      'state': 'folder'
    },
    initialize: function () {
    },
    upLevel: function (n) {
      if (this.get('path').length) {
        for (var i = 0; i < n; i++) {
          this.get('path').pop();
        }
        this.trigger('change:path');
        $("#incremental-infolder-search").focus();
      }
    },
    downLevel: function (name) {
      var path = this.get('path');
      if (this.get('Tree').findFolder(path = path.concat(name))) {
        this.set('path', path);
        $("#incremental-infolder-search").focus();
      }
    }
  });
  exports.Bookmark = Bookmark;
  exports.Folder = Folder;
  exports.TreeManager = TreeManager;
  exports.App = App;
});
