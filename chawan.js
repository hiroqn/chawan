// TODO hover ,edit comment, not login ,configuration
var RESOURCE = {
  BMTPL : '<div class="file item"  title="<%- title +"\n"+ comment %>"><div class="title"><a href="<%- url %>" target="_blank"> <%- title %><\/a><\/div><span class="comment"><%- comment %><\/span><span class="others"> <\/span><\/div>',
  FLDTPL : '<div class="folder item" data-name="<%- name %>"><h2><%- name %><\/h2><h3><%- count %><\/h3><\/div>',
  NAVITPL : '<span id="title">?Chawan<\/span><span id="breadcrumbs"><%- list %><\/span>'
};

var TreeMgr = function() {
  var Folder, Bookmark, TreeMgr, tagParam = /\[\?([^%\/\?\[\]]+?(?:\/[^%\/\?\[\]]+?)*)\]/g;
  /** Folder */
  Folder = function(name) {
    this.name = name;
    this.bookmarks = [];
    this.folders = [];
  };
  _.extend(Folder.prototype, {
    getFolder : function(name) {
      return _.find(this.folders, function(obj) {
        return obj.name == name;
      });
    },
    addFolder : function(name) {
      var folder = new Folder(name)
      this.folders.push(folder);
      return folder;
    },
    addBookmark : function(bm) {
      this.bookmarks.push(bm);
    },
    getBookmarkCount : function() {
      return this.bookmarks.length
          + _.reduce(this.folders, function(memo, folder) {
            return folder.getBookmarkCount() + memo;
          }, 0);
    }
  });
  /** Bookmark */
  Bookmark = function(title, comment, url, others) {
    this.title = title;
    // this.comment = comment;
    this.url = url;
    this.tagParser(comment);
  }
  _.extend(Bookmark.prototype, {
    tagParser : function(c) {
      var comment = (c || this.comment);
      this.hierarchy = _.map(comment.match(tagParam), function(str) {
        return str.slice(2, -1).split('/');
      });
      this.comment = comment.replace(tagParam, '');
    }
  });
  Bookmark.createByText = function(texts) {
    var array = texts.split('\n');
    var l = array.length / 4, bookmarks = [];
    for ( var i = 0; i < l; i++) {
      bookmarks[i] = new Bookmark(array[i * 3], array[1 + i * 3],
          array[2 + i * 3], array[i + l * 3])
    }
    return bookmarks;
  };
  /** Tree Manager */
  return TreeMgr = {
    root : new Folder('root'),
    getFolder : function(hierarchy) {
      var folder = this.root;
      for ( var i = 0; i < hierarchy.length; i++) {
        folder = folder.getFolder(hierarchy[i]);
        if (!folder) {
          return null
        }
      }
      ;
      return folder;
    },
    makeFolder : function(hierarchy) {
      var folder = this.root;
      for ( var i = 0; i < hierarchy.length; i++) {
        folder = (folder.getFolder(hierarchy[i]) || folder
            .addFolder(hierarchy[i]));
      }
      return folder;
    },
    setByText : function(texts) {
      _.each(Bookmark.createByText(texts), function(bookmark) {

        if (bookmark.hierarchy.length) {
          _.each(bookmark.hierarchy, function(tag) {
            TreeMgr.makeFolder(tag).addBookmark(bookmark);
          });
        } else {// dont have chawan
          TreeMgr.root.addBookmark(bookmark);
        }
      });
      return this;
    },
    moveBookmark : function(folder, bookmark) {
      folder.takeBookmark(bookmark);
      bookmark.tagParser(bm.comment);
      _.each(bookmark.hierarchy, function(tag) {
        TreeMgr.makeFolder(tag).addBookmark(bookmark);
      });
    },
    Folder : Folder,
    Bookmark : Bookmark
  };
}();

var NaviView = Backbone.View.extend({
  tagName : 'div',
  id : 'navi',
  template : _.template(RESOURCE.NAVITPL),
  initialize : function() {
    this.model.on('change:hierarchy', this.render, this);
    this.render();
  },
  render : function() {
    this.$el.html(this.template({
      list : _.reduce(this.model.get('hierarchy'), function(memo, val) {
        return memo + ' -> ' + val;
      }, 'root')
    }));
  }
});
var FoldersView = Backbone.View.extend({
  tagName : 'div',
  id : 'folder',
  initialize : function(options) {
    this.isRoot = options.isRoot;
    this.render();
  },
  events : {
    "click .folder" : "down",
    "click .upper" : "up"
  },
  bookmarkTpl : _.template(RESOURCE.BMTPL),
  folderTpl : _.template(RESOURCE.FLDTPL),
  render : function() {
    var bmTpl = this.bookmarkTpl, fldTpl = this.folderTpl;
    var html = _.reduce(this.model.bookmarks, function(memo, bm) {
      return memo + bmTpl(bm);
    }, '')
        + _.reduce(this.model.folders, function(memo, fld) {

          return memo + fldTpl({
            name : fld.name,
            count : fld.getBookmarkCount()
          });
        }, '')
        + (this.isRoot ? ''
            : '<div class="upper item"><h2>↑Parent<\/h2><\/div>');
    this.$el.html(html);
    console.log(this);
    return this;
  },
  down : function(e) {
    app.down(e.currentTarget.dataset.name);
  },
  up : function() {
    app.up();
  }
});

var AppModel = Backbone.Model.extend({
  defaults : {
    'isEmpty' : true,
    'hierarchy' : []
  },
  initialize : function() {
  },
  setText : function(texts) {
    this.get('TreeMgr').setByText(texts);
    this.set('isEmpty', false)
    this.trigger('change:TreeMgr');
  },
  up : function() {
    return this.get('hierarchy').pop() ? this.trigger('change:hierarchy')
        : null;
  },
  down : function(name) {
    var hierarchy = this.get('hierarchy');
    if (this.get('TreeMgr').getFolder(hierarchy.concat(name))) {
      hierarchy.push(name);
      this.trigger('change:hierarchy');
    }
  }
});

var AppView = Backbone.View.extend({
  tagName : 'div',
  id : 'contents',
  initialize : function(options) {
    this.router = options.router;
    this.model.on('change:TreeMgr', this.render, this);
    this.model.on('change:hierarchy', this.navigate, this);
    // this.render();
  },
  render : function() {
    var hierarchy = this.model.get('hierarchy');
    var tree = this.model.get('TreeMgr')
    var folder = tree.getFolder(hierarchy);
    if (folder && !this.model.get('isEmpty')) {
      // console.log('len',hierarchy.length)
      this.$el.empty().append((new FoldersView({
        model : folder,
        isRoot : (hierarchy.length == 0)
      })).el);
    }

    return this;
  },
  navigate : function() {
    this.router.navigate('!' + this.model.get('hierarchy').join('/'));
    this.render();
  }
});

initialize({
  ready : function(localText) {
    var appModel = window.app = new AppModel({
      TreeMgr : TreeMgr
    });
    var AppRouter = Backbone.Router.extend({
      routes : {
        "" : "top",
        "!" : "top",
        "!*path" : "moveTo"
      },
      top : function() {
        window.app.set('hierarchy', []);
      },
      moveTo : function(path) {
        window.app.set('hierarchy', path.split('/'));
      }
    });
    var router = new AppRouter();
    Backbone.history.start();
    var appView = new AppView({
      model : appModel,
      router : router
    });
    $('#container').append((new NaviView({
      model : appModel
    })).el).append(appView.el);
  },
  dataset : function(text) {
    app.setText(text);
  },
  onError : function(str) {
    alert(str);
  }
});