var AppView, NaviView, EditerView, FoldersView;


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
    // '<div class="upper item"><h2>↑Parent<\/h2><\/div>'
    this.$el.html(folderHTML + bookmarkHTML);
    return this;
  },
  down: function (e) {
    app.downLevel(e.currentTarget.dataset.name);
  },
  up: function () {
    app.upLevel();
  },
  edit: function (e) {
    var bookmark = this.model.getBookmarkByDate(e.currentTarget.dataset.date);
    if (bookmark) {
      this.trigger('edit', bookmark);
    }
  },
  link: function (e) {
    if ($(e.target).hasClass('bookmark')) {
      var bookmark = this.model.getBookmarkByDate(e.currentTarget.dataset.date);
    }
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
    app.get('Tree').setComment(this.model, text);
    this.destroy();
  },
  cancel: function (e) {
    if (e.target.className === 'editer-wrapper') {
      this.destroy();
    }
  },
  destroy: function () {
    app.set('isModal', false);
    this.remove();
  }
});

AppView = Backbone.View.extend({
  initialize: function () {
    this.naviView = new NaviView({
      model: app
    });
    app.get('Tree').on('change', this.render, this);
    app.on('change:path', this.render, this);
    app.on('change:isModal', this.modal, this);
    this.$container = $('<div />', {"class": "container"});
    this.$overlay = $('<div />', {"class": "overlay"});
    this.$el.append(this.naviView.el, this.$container, this.$overlay);
  },
  render: function () {
    var folder =app.get('Tree').getFolder(app.get('path'));
    if (folder && folder.count) {
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
    if (app.get('isModal')) {
      this.$el.addClass('modal-enable');
    } else {
      this.$el.removeClass('modal-enable');
    }
  },
  createEditer: function (bookmark) {
    var eV = new EditerView({model: bookmark});
    app.set('isModal', true);
    this.$overlay.append(eV.el);
  }
});