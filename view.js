us$.modules.define('view', function (exports, require, module) {

  var NaviView, EditorView, FoldersView;
  FoldersView = Backbone.View.extend({
    tagName: 'div',
    id: 'contents',
    initialize: function () {
      this.render();
    },
    events: {
      "click .folder": "down",
      "click .upper": "up",
      "click .destroy-icon": "destroy",
      "click .edit-icon": "edit"
    },
    bookmarkTmpl: _.template(TEXT.bookmarksTemplate),
    folderTmpl: _.template(TEXT.foldersTemplate),
    render: function () {
      return this.refresh(this.model.folders, this.model.bookmarks);
    },
    refresh: function(folders, bookmarks) {
      var bookmarkHTML = this.bookmarkTmpl({bookmarks: bookmarks}), // bookmarkHTML
          folderHTML = this.folderTmpl({folders: folders});// folderHTML
      this.$el.html(folderHTML + bookmarkHTML);
      return this;
    },
    getDestination: function() {
        var contents = $('#contents').children();
        if (contents.length == 1) {
          var content = contents[0];
          if (content.className == "folder") {
            return {method:'downLevel', value:content.getAttribute('data-name')};
          } else if (content.className == "bookmark") {
            return {method:'href', value: content.getElementsByTagName("a")[0].getAttribute('href')};
          }
        } else {
          return false;
        }
    },
    down: function (e) {
      this.$el.trigger('down', e.currentTarget.dataset.name);
      //      app.downLevel(e.currentTarget.dataset.name);
    },
    up: function () {
      this.$el.trigger('up', 1);
    },
    destroy: function (e) {
      var bookmark = this.model.getBookmarkByBid(e.currentTarget.dataset.date);
      if (bookmark) {
        this.$el.trigger('destroy', bookmark);
      }
    },
    edit: function (e) {
      var bookmark = this.model.getBookmarkByBid(e.currentTarget.dataset.date);
      if (bookmark) {
        this.$el.trigger('edit', bookmark);
      }
    }
  });
  EditorView = Backbone.View.extend({
    tagName: 'div',
    className: 'editor-wrapper',
    events: {
      "click .submit": 'submit',
      "click .cancel": "destroy",
      "click": "cancel"
    },
    tmpl: _.template(TEXT.editorTemplate),
    initialize: function () {
      this.render();
    },
    render: function () {
      this.$el.html(this.tmpl(this.model));
      return this;
    },
    submit: function () {
      var text = this.$('.editor-input').val();
      this.trigger('submit', text);
      this.destroy();
    },
    cancel: function (e) {
      if (e.target.className === 'editor-wrapper') {
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
    inFolderSearchTimer: null,
    inFolderSearchInterval: 500,
    events: {
      'click #name': function () {
        this.model.upLevel(1);
      },
      'click #breadcrumbs span': function (e) {
        var n = Number(e.target.dataset.position);
        if (!isNaN(n)) {
          this.model.upLevel(n);
        }
      },
      'focus #incremental-infolder-search': "searchInFolder",
      'blur #incremental-infolder-search': "stopSearchInFolder",
      'keydown #incremental-infolder-search': "enterSearchInFolder"
    },
    initialize: function () {
      this.model.on('change:path', this.render, this);
      this.render();
    },
    focusOnSearchBox: function () {
      this.$el.find('#incremental-infolder-search').focus();
    },
    render: function () {
      this.$el.html(this.tmpl({
        list: this.model.get('path'),
        length: this.model.get('path').length
      }));
    },
    searchInFolder: function() {
      var searchText = $('#incremental-infolder-search').val();
      this.model.get('Tree').searchInFolder(this.model.get('path'), searchText);
      this.inFolderSearchTimer = setTimeout(this.searchInFolder.bind(this), this.inFolderSearchInterval);
    },
    stopSearchInFolder: function() {
      clearTimeout(this.inFolderSearchTimer);
    },
    enterSearchInFolder: function(event) {
      if (event.keyCode == 13) {
        // cancel default action of putting 'enter' key (submitting)
        event.preventDefault();
        this.trigger('enterSearchInFolder');
      }
    }
  });
  var ConfigView = Backbone.View.extend({
    initialize: function () {}
  });

  exports.AppView = Backbone.View.extend({
    initialize: function () {
      var app = this.model;
      app.get('Tree').on('change', this.render, this);
      app.get('Tree').on('infolder-search', this.refreshFolderView, this);
      app.on('change:path', this.render, this);
      app.on('change:state', this.toggleState, this);
      this.$container = $('<div />', {"class": "container"});
      this.$overlay = $('<div />', {"class": "overlay"});
      this.configView = new ConfigView();
      var naviView = new NaviView({model:app});
      naviView.on('enterSearchInFolder', this.mayEnterNextPage, this);
      this.$el.append(
          naviView.el,
          this.$container,
          this.$overlay);
      app.on('change:downLevel', naviView.focusOnSearchBox, naviView);
      app.on('change:path', naviView.focusOnSearchBox, naviView);
      naviView.focusOnSearchBox();
    },
    events: {
      "edit .container": 'createEditor',
      "down .container": function (e, name) {
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
    refreshFolderView: function (folders, bookmarks) {
      if (this.folderView && (folders.length != 0 || bookmarks.length != 0)) {
        this.folderView.refresh(folders, bookmarks);
      }
    },
    toggleModal: function (bool) {
      if (bool) {
        this.$el.addClass('modal-enable');
      } else {
        this.$el.removeClass('modal-enable');
      }
    },
    toggleState: function () {
      switch (this.model.get('state')) {
      case 'folder':
        break;
      case 'config':
          this.toggleModal(true);
        break;
      }

    },
    createEditor: function (e, bookmark) {
      var editor = new EditorView({model: bookmark});
      this.toggleModal(true);
      this.$overlay.append(editor.el);
      editor.on('submit', function (text) {
        this.trigger('submit', bookmark, text);
      }, this);
      editor.on('remove', function () {this.toggleModal(false)}, this);
    },
    mayEnterNextPage: function() {
      var destination = this.folderView.getDestination();
      if (destination) {
        this.model.moveTo(destination);
      }
    }
  });
})
;
