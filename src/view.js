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

var FolderView = Backbone.View.extend({
  tagName: 'article',
  initialize: function (attr) {
    this.app = attr.app;
  },
  template: template.folder,
  events: {
    "click .delete-icon": "_delete",
    "click .edit-icon": "_edit"
  },
  render: function () {
    var folder = this.model.filter(this.app.get('searchWord')),
        path = this.app.get('path'),
        html = this.template({
          folders: folder.folders,
          bookmarks: folder.bookmarks,
          path: path.length ? path.join('/') + '/' : ''
        });
    this.$el.html(html);
    return this;
  },
  _delete: function () {
  },
  _edit: function () {
  }
});

var NavView = Backbone.View.extend({
  tagName: 'nav',
  template: template.nav,
  initialize: function () {
    this.model.on('change:path', this.render, this);
    this.render();
  },
  render: function () {
    this.$el.html(this.template({
      list: this.model.get('path'),
      length: this.model.get('path').length
    }));
    return this;
  }
});

exports.App = Backbone.View.extend({// this element is body
  initialize: function () {
    var app = this.model;
    app.on('change:path', this.render, this);
    app.on('change:tree', this.render, this);
    app.on('change:modal', function () {
    }, this);
    this.navView = new NavView({model: app});
    this.folderView = new FolderView({app: app});
    this.$el.empty().append(this.navView.el, this.folderView.el);
  },
  render: function () {
    var app = this.model;
    var folder = app.getFolderModel();
    if (folder) {
      this.folderView.model = folder;
      this.folderView.render();
    }
    return this;
  }

});
