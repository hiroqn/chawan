us$.modules.add('view', function (exports, require, module) {

  var NaviView, EditerView, FoldersView;
  FoldersView = Backbone.View.extend({
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
      this.$el.html(folderHTML + bookmarkHTML);
      return this;
    },
    down: function (e) {
      this.$el.trigger('down', e.currentTarget.dataset.name);
      //      app.downLevel(e.currentTarget.dataset.name);
    },
    up: function () {
      this.$el.trigger('up', 1);
    },
    edit: function (e) {
      var bookmark = this.model.getBookmarkByBid(e.currentTarget.dataset.date);
      if (bookmark) {
        this.$el.trigger('edit', bookmark);
        //        this.trigger('edit', bookmark);
      }
    }
  });
  EditerView = Backbone.View.extend({
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
      this.trigger('submit', text);
      this.destroy();
    },
    cancel: function (e) {
      if (e.target.className === 'editer-wrapper') {
        this.destroy();
      }
    },
    destroy: function () {
      this.remove();
      this.trigger('remove');
    }
  });

  NaviView = Backbone.View.extend({
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


  exports.AppView = Backbone.View.extend({
    initialize: function () {
      var app = this.model;
      this.naviView = new NaviView({model: app});
      app.get('Tree').on('change', this.render, this);
      app.on('change:path', this.render, this);
      app.on('change:modal', this.modal, this);
      this.$container = $('<div />', {"class": "container"});
      this.$overlay = $('<div />', {"class": "overlay"});
      this.$el.append(
          new NaviView({model: app}).el,
          this.$container,
          this.$overlay);
    },
    events: {
      "edit .container": 'createEditer',
      "down .container": function (name) {
        this.model.downLevel(name);
      }
    },
    render: function () {
      var app = this.model;
      var folder = app.get('Tree').findFolder(app.get('path'));
      if (folder) {
        if (this.folderView) {
          this.folderView.remove();
        }
        this.folderView = new FoldersView({model: folder});
        this.$container.append(this.folderView.el);
      }
      return this;
    },
    modal: function () {
      if (this.model.get('modal')) {
        this.$el.addClass('modal-enable');
      } else {
        this.$el.removeClass('modal-enable');
      }
    },
    createEditer: function (bookmark) {
      var editer = new EditerView({model: bookmark});
      this.model.set('modal', true);
      this.$overlay.append(editer.el);
      editer.on('submit', function (text) {
        this.trigger('submit', bookmark, text);
      }, this);
      editer.on('remove', function () {this.model.set('modal', false);}, this);
    }
  });
});
