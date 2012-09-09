var Backbone = require('backbone'),
    template = require('./template.js');
Backbone.$ = require('jQuery');

exports.Config = Backbone.View.extend({
  events: {
    "click .save": "save",
    "click .cancel": "cancel"
  },
  template: template.config,
  initialize: function () {
    this.render();
  },
  render: function () {
    this.$el.html(this.template(this.model));
    //    this.$el.show();
    return this;
  },
  save: function () {
    var text = this.$('.config-input').val();
    this.model.setCondition(text);
    this.model.save();
    console.log('saved'); // TODO add save notification
  },
  cancel: function () {
    //    this.render();
  }
});

var EditorView = Backbone.View.extend({
  tagName: 'section',
  className: 'editor',
  template: template.editor,
  events: {
    "click .submit": 'submit'
  },
  render: function () {
    this.$el.html(this.template(this.model));
    return this;
  },
  submit: function () {
    this.trigger('submit', this.model, this.$('.editor-input').val());
  }
});

var DialogView = Backbone.View.extend({
  tagName: 'section',
  className: 'dialog',
  template: template.dialog,
  events: {
    "click .submit": 'submit',
    "click .cancel": 'cancel'
  },
  render: function () {
    this.$el.html(this.template(this.model));
    return this;
  },
  submit: function () {
    this.trigger('submit', this.model);
  },
  cancel: function () {
    this.trigger('cancel');
  }
});

var FolderView = Backbone.View.extend({
  tagName: 'article',
  initialize: function (attr) {
    this.app = attr.app;
    this.app.on('change:searchWord', this.render, this);
  },
  template: template.folder,
  events: {
    "click .icon-pencil": function (e) {
      var bookmark = this.model.get('folder').getBookmarkByBid(e.currentTarget.dataset.bid);
      this.trigger('edit', bookmark);
    },
    "click .icon-remove": function (e) {
      var bookmark = this.model.get('folder').getBookmarkByBid(e.currentTarget.dataset.bid);
      this.trigger('remove', bookmark);
    }
  },
  render: function () {
    var folder = this.model.filter(this.app.get('searchWord')),
        path = this.app.get('path'),
        html = folder ? this.template({
          folders: folder.folders,
          bookmarks: folder.bookmarks,
          path: path.length ? path.join('/') + '/' : ''
        }) : '';
    this.$el.html(html);
    return this;
  },
  setFolderModel: function (model) {
    this.model = model;
    return this;
  }
});

var NavView = Backbone.View.extend({
  tagName: 'nav',
  template: template.nav,
  watchInterval: 500,
  events: {
    "focus #searchWord": 'startWatch',
    "blur #searchWord": 'stopWatch'
  },
  initialize: function () {
    this.model.on('change:path', this.render, this);
    this.render();
  },
  render: function () {
    this.$el.html(this.template({
      list: this.model.get('path'),
      length: this.model.get('path').length
    }));
    this.$('#searchWord').focus();
    //this.startWatch();
    return this;
  },
  startWatch: function () {
    if (this.timer) {
      this.stopWatch();
    }
    this.watchSearchWord();
    this.timer = setInterval(this.watchSearchWord.bind(this),
        this.watchInterval);
  },
  stopWatch: function () {
    clearTimeout(this.timer);
    this.timer = null;
  },
  watchSearchWord: function () {
    this.model.set('searchWord', this.$('#searchWord').val());
  }
});

exports.App = Backbone.View.extend({// this element is body
  initialize: function () {
    var app = this.model;
    app.on('change:path', this.render, this);
    app.on('change:tree', this.render, this);
    this.navView = new NavView({model: app});
    this.folderView = new FolderView({app: app});
    this.folderView.on('edit', this.openEditor, this);
    this.folderView.on('remove', this.openDialog, this);
    this.$el.empty()
        .append(this.navView.el, this.folderView.el)
        .append('<div class="modal-backdrop" />');
  },
  events: {
    "click .modal-backdrop": 'close'
  },
  render: function () {
    var app = this.model;
    var folder = app.getFolderModel();
    if (folder) {
      this.folderView.setFolderModel(folder).render();
    }
    return this;
  },
  openEditor: function (bookmark) {
    var editorView = this.editorView = new EditorView({model: bookmark});
    editorView.on('submit', function (bookmark, commnet) {
      this.trigger('submit:edit', bookmark, commnet);
      this.close();
    }, this);
    this.modal(true);
    this.model.set('state', 'editing');
    this.$el.append(editorView.render().el);
  },
  openDialog: function (bookmark) {
    var dialogView = this.dialogView = new DialogView({model: bookmark});
    dialogView.on('submit', function (bookmark) {
      this.trigger('submit:remove', bookmark);
      this.close();
    }, this);
    dialogView.on('cancel', this.close(), this);
    this.modal(true);
    this.model.set('state', 'dialog');
    this.$el.append(dialogView.render().el);
  },
  close: function () {
    switch (this.model.get('state')) {
    case 'editing':
      this.editorView.remove();
      this.model.set('state', 'normal');
      break;
    case 'dialog':
      this.dialogView.remove();
      this.model.set('state', 'normal');
    }
    this.modal(false);
  },
  modal: function (isModal) {
    this.$('.modal-backdrop')[isModal ? 'show' : 'hide']();
  }
});
