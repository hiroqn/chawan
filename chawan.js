us$.modules.add('model', function (exports, require, module) {
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
    this.bid = 'b'+counter++;
  }
  /**
   * @param title
   * @param comment
   * @param url
   * @param others
   * @return {Bookmark}
   */
  Bookmark.create = function (title, comment, url, others) {
    var b =  new Bookmark(title, comment, url, others);
    b.commentParser(comment);
    return b;
  };
  _(Bookmark.prototype).extend({
    updateComment: function(comment){
      this.rawComment = comment;
    },
    commentParser: function (comment) {//TODO change
      this.rawComment = comment;
      this.chawans = _(comment.match(chawanParam)).map(function (str) {
        return str.slice(2, -1).split('/');
      });
      comment = comment.replace(chawanParam, '');
      this.tags = comment.match(tagParam);
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
    pickBookmark: function(bookmark){
      var index = this.bookmarks.indexOf(bookmark);
      if (~index) {// tilde
        this.bookmarks.splice(index, 1);
        return true;
      } else {
        return false;
      }
    },
    getBookmarkByBid: function(bid){
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
    findFolder: function(path){
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
    getFolder: function (path, isNew) {
      var folder = this.root;
      if (path.length === 0) {
        return folder;
      }
      for (var i = 0; i < path.length; i++) {
        folder = folder.getFolder(path[i]) || folder.addFolder(path[i]);
      }
      return folder;
    },
    addBookmarks:function(bookmarkArray){
      this.allBookmarks = this.allBookmarks.concat(bookmarkArray);
      var condition = this.get('config').folder,
          Tree = this,
          folder;
      condition.forEach(function(cond){
        Tree.getFolder(cond.name);
        bookmarkArray.filter(function(bookmark){

        });
      });
    },
    addByText: function (texts) {//TODO c obsolete
      var array = texts.split('\n'), l = array.length /
                                         4, bookmarks = new Array(l);
      var Tree = this;
      for (var i = 0; i < l; i++) {
        bookmarks[i] = this.Bookmark.create(array[i * 3], array[1 + i * 3],
            array[2 + i * 3], array[i + l * 3]);
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
      'modal': false
    },
    initialize: function () {
    },
    upLevel: function (n) {
      if (this.get('path').length) {
        for (var i = 0; i < n; i++) {
          this.get('path').pop();
        }
        this.trigger('change:path');
      }
    },
    downLevel: function (name) {
      var path = this.get('path');
      if (this.get('Tree').findFolder(path = path.concat(name))) {
        this.set('path', path);
      }
    }
  });
  exports.Bookmark = Bookmark;
  exports.Folder = Folder;
  exports.TreeManager = TreeManager;
  exports.App = App;
});
