var Backbone = require('backbone'),
    template = require('./template.js');
Backbone.$ = require('jQuery');

exports.Config = Backbone.View.extend({
  events: {
    "click .save": "save",
    "click .cancel": "cancel",
    "click .add-all-tags": "addAllTags"
  },
  template: template.config,
  initialize: function () {
    document.title = "Chawan?: config"
    this.render();
    this.model.loadTags(this.showTags.bind(this));
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
    // TODO add better save notification
    var notification = this.$("#notification");
    notification.text("saved!");
    notification.show();
    notification.fadeOut(2000);
  },
  cancel: function () {
    //    this.render();
  },
  addAllTags: function () {
    var tagsStr = '';
    this.$(".tag-item").each(function(index, tag){
      tagsStr += '[' + Backbone.$(tag).text() + ']\n';
    });
    this.insertToConfig(tagsStr);
  },
  showTags: function (tags) {
    var $tags = this.$("#tags");
    $tags.text("");
    for (var i = 0; i < tags.length; i++) {
      tag = tags[i];
      var tagButton = Backbone.$("<div>");
      tagButton.addClass("tag-item");
      tagButton.text(tag);
      tagButton.click(this.insertToConfig.bind(this, '[' + tag + ']'));
      $tags.append(tagButton);
    }
  },
  insertToConfig: function (str) {
    var input = Backbone.$(".config-input");
    var position = input[0].selectionStart || 0;
    var val = input.val();
    var newPosition = position + str.length;
    input.val(val.substring(0, position) + str + val.substring(position));
    input[0].setSelectionRange(newPosition, newPosition);
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
    "blur #searchWord": 'stopWatch',
    "keydown #searchWord": 'keydownHandler'
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
  keydownHandler: function(event) {
    if (event.keyCode == 13) { // when enter key is pressed
      this.trigger('mayMove');
    }
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
    this.navView.on('mayMove', this.mayMoveLocation, this);
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
  mayMoveLocation: function () {
    var app = this.model;
    var folder = app.getFolderModel().filter(app.get('searchWord'));
    if (folder.folders.length == 0 && folder.bookmarks.length == 1) {
      location.href = folder.bookmarks[0].url;
    } else if (folder.folders.length == 1 && folder.bookmarks.length == 0) {
      var separator;
      if (location.href.indexOf("]") == location.href.length - 1) {
        separator = "/";
      } else {
        separator = "#!";
      }
      location.href = location.href + separator + folder.folders[0].name;
    }
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
