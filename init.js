function HatenaClient(id, rks) {
  this.id = id;
  this.rks = rks;
  this.editURL = 'http://b.hatena.ne.jp/' + id + '/add.edit.json';
  this.destroyURL = 'http://b.hatena.ne.jp/' + id + '/add.delete'
}
_(HatenaClient).extend({
  searchData: function (id) {
    var searchURL = 'http://b.hatena.ne.jp/ ' + id + '/search.data';
    return jQuery.post(searchURL, null, null, 'text');
  },
  myName: function () {
    var dfd = $.Deferred(),
        nameURL = 'http://b.hatena.ne.jp/my.name';
    jQuery.get(this.nameURL, null, null, 'json').then(function (object) {
      if (object.login) {
        dfd.resolve(object);
      } else {
        dfd.reject();
      }
    }, dfd.reject.bind(dfd));
    return dfd.promise();
  }
});
_(HatenaClient.prototype).extend({
      editComment: function (url, comment) {
        var dfd = $.Deferred(),
            postData = {
              url: url,
              comment: comment,
              from: 'inplace',
              rks: this.rks
            };
        jQuery.post(this.editURL, postData, null, 'json').then(
            function (object) {
              if (object.success) {
                dfd.resolve(object.comment_raw);
              } else {
                dfd.reject();
              }
            }, dfd.reject.bind(dfd));
        return dfd.promise();
      },
      destroyBookmark: function (bookmark) {
        return jQuery.post(this.destroyURL, {url: bookmark.url, rks: this.rks},
            null, 'text');
      }
    }
);
(function () {
  var apply = Function.prototype.apply,
      slice = Array.prototype.slice;
  var us$ = function (fn) {
        fn();
      },
      nameList = {},
      DOMDeferred = $.Deferred(),
      dummyDeferred = $.Deferred();
  _(us$).extend({
    register: function (name, regExp, callback) {
      if (window.location.href.match(regExp)) {
        nameList[name] = {
          dfd: $.Deferred()
        };
        if (callback) {
          callback(function (err) {
            if (err) {
              nameList[name].dfd.reject();
            }
            (nameList[name].arg = slice.call(arguments)).shift();
          });
        } else {
          nameList[name].dfd.resolve();
        }
      }
    },
    ready: function (name) {
      if (name) {
        return DOMDeferred;
      }
      if (nameList[name]) {
        DOMDeferred.done(function () {
          nameList[name].dfd.resolve(nameList[name].arg);
        });
        return nameList[name].dfd;
      } else {
        return dummyDeferred;
      }
    }
  });
  $(document).ready(DOMDeferred.resolve.bind(DOMDeferred));
  /*
   * module
   */
  var modules = {},
      exports = {},
      require;
  function Module(name) {
    this.exports = {};
    this.id = name;
    this.loaded = true;
  }
  Module.prototype.require = require = function (name) {
    //(function (exports,require,module,__filename,__dirname))
    if (exports.hasOwnProperty(name)) {
      return exports[name];
    } else {
      var module = new Module(name);
      if (modules.hasOwnProperty(name)) {
        exports[name] =module.exports;
        modules[name].call(require.exports, module.require, module);
      }
      return module.exports;
    }
  };

  _(us$).extend({
    require: require,
    modules: {
      require: require,
      add: function (name, func) {
        modules[name] = func;
      }
    }
  });
  _(us$).extend({
    addStyle: function (css) {
      if (GM_addStyle) {
        GM_addStyle(css);
      } else {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        document.getElementsByTagName('head')[0].appendChild(style);
      }
    },
    log: function () {
      return (GM_log || console).apply(null, arguments);
    }
  });
  $(document).ready(DOMDeferred.resolve.bind(DOMDeferred));
  window.us$ = us$;
})();
us$(function () {
  document.title = '?Chawan';
  window.ctrl = {};
});
us$.register('normal', /^http:\/\/b.hatena.ne.jp\/my\.name\?chawan=.+$/,
    function (callback) {
      var result = window.location.href.match(/\?chawan=(\w+)/);
      callback(null, HatenaClient.serchData(result[1]));

    });
us$.register('config', /^http:\/\/b.hatena.ne.jp\/my\.name$/,
    function (callback) {
    });
us$.register('tags', /^http.*\/([^\/]+)\/tags\.json(#.+)?$/,
    function (callback) {
    });
