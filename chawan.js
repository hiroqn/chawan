
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
    this.root.getBookmarkCount();
    this.trigger('change');

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
    this.set('TreeManager', TreeManager);
  },
  setText: function (texts) {
    TreeManager.addByText(texts);
  },
  upLevel: function () {
    var n = arguments[0] || arguments[0] === 0 || 1;
    if (this.get('path').length) {
      for (var i = 0; i < n; i++) {
        this.get('path').pop();
      }
      this.trigger('change:path');
    }
  },
  downLevel: function (name) {
    var path = this.get('path');
    if (TreeManager.getFolder(path = path.concat(name))) {
      this.set('path', path);
    }
  }
}))();

var EditerView = Backbone.View.extend({
  tagName: 'div',
  className: 'editer-wrapper',
  events: {
    "click .submit": 'submit',
    "click .cancel": "destroy",
    "click": "cancel"
  },
  tmpl: _.template(TEXT.editerTemplate),
  initialize: function () {
    this.render();
  },
  render: function () {
    this.$el.html(this.tmpl(this.model));
    return this;
  },
  submit: function () {
    var text = this.$('.editer-input').val();
    TreeManager.setComment(this.model, text);
    this.destroy();
  },
  cancel: function (e) {
    if (e.target.className === 'editer-wrapper') {
      this.destroy();
    }
  },
  destroy: function () {
    window.app.set('isModal', false);
    this.remove();
  }
});

var FoldersView = Backbone.View.extend({
  tagName: 'div',
  id: 'contents',
  initialize: function () {
    this.render();
  },
  events: {
    "click .folder": "down",
    "click .upper": "up",
    "click .edit-icon": "edit"
  },
  bookmarkTmpl: _.template(TEXT.bookmarksTemplate),
  folderTmpl: _.template(TEXT.foldersTemplate),
  render: function () {
    var bookmarkHTML = this.bookmarkTmpl({bookmarks: this.model.bookmarks}), // bookmarkHTML
      folderHTML = this.folderTmpl({folders: this.model.folders});// folderHTML
    // '<div class="upper item"><h2>↑Parent<\/h2><\/div>'
    this.$el.html(folderHTML + bookmarkHTML);
    return this;
  },
  down: function (e) {
    window.app.downLevel(e.currentTarget.dataset.name);
  },
  up: function () {
    window.app.upLevel();
  },
  edit: function (e) {
    var bookmark = this.model.getBookmarkByDate(e.currentTarget.dataset.date);
    if (bookmark) {
      this.trigger('edit', bookmark);
    }
  },
  link: function (e) {
    if($(e.target).hasClass('bookmark')){
      var bookmark = this.model.getBookmarkByDate(e.currentTarget.dataset.date);
    }
  }
});

var NaviView = Backbone.View.extend({
  tagName: 'div',
  id: 'navi',
  tmpl: _.template(TEXT.naviTemplate),
  events: {
    'click #title': function () {
      this.model.set('path', []);
    },
    'click #breadcrumbs span': function (e) {
      var n = Number(e.target.dataset.position);
      if (!isNaN(n)) {
        this.model.upLevel(n);
      }
    }
  },
  initialize: function () {
    this.model.on('change:path', this.render, this);
    this.render();
  },
  render: function () {
    this.$el.html(this.tmpl({
      list: this.model.get('path'),
      length: this.model.get('path').length
    }));
  }
});

var AppView = Backbone.View.extend({
  initialize: function () {
    this.naviView = new NaviView({
      model: app
    });
    this.model.get('TreeManager').on('change', this.render, this);
    this.model.on('change:path', this.render, this);
    this.model.on('change:isModal', this.modal, this);
    this.$container = $('<div />', {"class": "container"});
    this.$overlay = $('<div />', {"class": "overlay"});
    this.$el.append(this.naviView.el, this.$container, this.$overlay);
  },
  render: function () {
    var folder = this.model.get('TreeManager').getFolder(this.model.get('path'));
    if (folder && folder.getBookmarkCount()) {
      if (this.folderView) {
        this.folderView.remove();
      }

      this.folderView = new FoldersView({
        model: folder,
        $wrapper: this.$overlay
      });
      this.folderView.on('edit', this.createEditer, this);
      this.$container.append(this.folderView.el);
    }
    return this;
  },
  modal: function () {
    if (this.model.get('isModal')) {
      this.$el.addClass('modal-enable');
    } else {
      this.$el.removeClass('modal-enable');
    }
  },
  createEditer: function (bookmark) {
    var eV = new EditerView({model: bookmark});
    window.app.set('isModal', true);
    this.$overlay.append(eV.el);
  }
});

us$.dom.then(function (dataDeferred) { // DOMContentLoaded
  var body = $('body');
  new AppView({
    model: app,
    el: 'body'
  });
  var router = new (Backbone.Router.extend({
    routes: {
      "": "top",
      "!": "top",
      "!*path": "moveTo",
      "configure": "configure"
    },
    top: function () {
      window.app.set('path', []);
    },
    moveTo: function (path) {
      window.app.set('path', _(path.split('/')).map(function (str) {
        return decodeURIComponent(str);
      }));
    },
    configure: function () {

    }
  }))();
  app.on('change:path', function () {
    router.navigate('!' + app.get('path').join('/'));
  });
  Backbone.history.start();
  //data setter
  dataDeferred.then(function (text) {
    app.setText(text);
  }, function () {
    alert('cant get searchData ');
  });
  //scroll majik
  var flag = false;
  var debounce = _.debounce(function () {
    body.removeClass('majik');
    flag = false;
  }, 1000);
  var scrollMajik = _.throttle(function () {
    if (flag) {
      debounce();
    } else {
      _.defer(function () {
        body.addClass('majik');
      });
      flag = true;
      debounce();
    }
  }, 200);
  $(window).scroll(scrollMajik);
}, function (str) {//on error
  alert(str);
});
