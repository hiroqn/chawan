us$.modules.define('ctrl', function (exports, require, module) {
  var model = require('model');
  var view = require('view');

  function Controller(client, conf) { // this is not controller mvc
    this.client = client;
    var config = new model.Config(conf);
    var appModel = this.app = new model.App({
      path: [],
      config: config,
      Tree: new model.TreeManager({config: config})
    });
    var Router = Backbone.Router.extend({
      routes: {
        "": "top",
        "!": "top",
        "!*path": "moveTo"
      },
      top: function () {
        appModel.set('path', []);
      },
      moveTo: function (path) {
        appModel.set('path', path.split('/').map(function (str) {
          return decodeURIComponent(str);
        }));
      }
    });
    router = new Router();
    appModel.on('change:path', function () {
      router.navigate('!' + appModel.get('path').join('/'));
    });
    Backbone.history.start();
    var appView = new view.AppView({
      model: appModel,
      el: document.body
    });
    appView.on('submit', this.editComment, this);
    this.view = appView;
  }

  _(Controller.prototype).extend(Backbone.Events, {
    addByText: function (texts) {
      var array = texts.split('\n'),
          l = array.length / 4, bookmarks = new Array(l);
      for (var i = 0; i < l; i++) {
        bookmarks[i] = model.Bookmark.create(array[i * 3], array[1 + i * 3],
            array[2 + i * 3], array[i + l * 3]);
      }
      this.app.get('Tree').addBookmarks(bookmarks);
      this.view.render();
    },
    editComment: function (bookmark, text) {
      var dfd = this.client.editComment(bookmark.url, text);
      var Tree = this.app.get('Tree');
      dfd.then(function (comment) {
        Tree.moveBookmark(bookmark, comment);
      }, function () {
        // error
      });
    },
    deleteBookmark: function (bookmark) {
      var dfd = this.client.deleteBookmark(bookmark);
    }
  });
  module.exports = Controller;
});
us$.ready().done(function () {
  us$.addStyle(TEXT.CSS);
  var body = $('body'), // cache body element
      flag = false, // scroll majik
      debounce = _.debounce(function () {
        body.removeClass('majik');
        flag = false;
      }, 600),
      throttle = _.throttle(function () {
        if (!flag) {
          body.addClass('majik');
          //          _.defer(function () {
          //            body.addClass('majik');
          //          });
          flag = true;
        }
        debounce();
      }, 400);
  $(window).scroll(throttle);

});
us$.ready('normal').done(function (dataDeferred) {
  var myName = JSON.parse($('pre').text());
  $('body').empty();
  if (!myName.login) {
    throw new Error('not Login');
  }
  var config = localStorage.chawan;

  var client = new HatenaClient(myName.name, myName.rks),
      Controller = us$.require('ctrl');
  var ctrl = new Controller(client, JSON.parse(config));
  dataDeferred.done(ctrl.addByText.bind(ctrl));
});
us$.ready('setup').done(function () {
  var myName = JSON.parse($('pre').text());
  $('body').empty();
  if (!myName.login) {
    throw new Error('not Login');
  }
  var html = '<div style="margin: auto;">' +
             '<a href="http://b.hatena.ne.jp/my.name?=<%- name %>" style="font-size: 8em;color: #ffffff;">Welcome to ?Chawan</a>' +
             '</div>';
  $('body').append(_.template(html, {name: myName.name}));
});
us$.ready('tags').done(function (dataDeferred, nameDeferred) {
  var tagsJSON = $('pre').text(),
      obj = JSON.parse(tagsJSON),
      count = obj.count,
      tags = obj.tags,
      dummyArray = [],
      Controller = us$.require('ctrl'),
      conditions = Object.keys(tags).map(
          function (tag) {
            return {
              name: tag,
              children: dummyArray,
              condition: [
                [tag]
              ]
            };
          });
  $('body').empty();
  nameDeferred.done(function (myName) {
    var client = new HatenaClient(myName.name, myName.rks),
        ctrl = new Controller(client, {folder: conditions, tags: true});
    dataDeferred.done(ctrl.addByText.bind(ctrl));

  });
});
us$.ready('config').done(function (dataDeferred) {
  var name = JSON.parse($('pre').text()).name;
  $('body').empty();
  var view = us$.require('view');
  var model = us$.require('model');
  var configModel = this.app = new model.Config({name: name});
  var configView = new view.ConfigView({
      model: configModel,
      el: document.body
    });
});