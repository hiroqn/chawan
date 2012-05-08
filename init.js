var User = {
  login: false
};
var Hatena = {
  searchData: function () {
    return jQuery.post("http://b.hatena.ne.jp/" + User.id + "/search.data", null, null, 'text');
  },
  myName: function () {
    var dfd = $.Deferred();
    jQuery.get("http://b.hatena.ne.jp/my.name", null, null, 'json').then(function (object) {
      if (object.login) {
        dfd.resolve(object);
      } else {
        dfd.reject();
      }
    }, function () {
      dfd.reject();
    });
    return dfd.promise();
  },
  editComment: function (url, comment) {
    var dfd = $.Deferred();
    jQuery.post('http://b.hatena.ne.jp/' + User.id + '/add.edit.json', {
      url: url,
      comment: comment,
      from: 'inplace',
      rks: User.rks
    }, null, 'json').then(function (object) {
        if (object.success) {
          dfd.resolve(object.comment_raw);
        } else {
          dfd.reject();
        }
      }, function () {
        dfd.reject();
      });
    return dfd.promise();
  },
  destroyBookmark: function (bookmark) {
    return jQuery.post('http://b.hatena.ne.jp/' + User.id + '/add.delete', {
      url: bookmark.url,
      rks: User.rks
    }, null, 'text');
  }
};
(function () {
  var us$ = function (fn) {
      fn();
    }, // defferd for dom-load
    domDfd = $.Deferred(), // deferd
    searchDataDfd, myNameDfd, domReady, //url match tags json
    tags = window.location.href.match(/^http.*\/([^\/]+)\/tags\.json(#.+)?$/), // url match my.name http://b.hatena.ne.jp/my.name
    myName = window.location.href.match(/^http:\/\/b\.hatena\.ne\.jp\/my\.name(\?chawan=.+)?(#.+)?$/);
  _(us$).extend({
    dom: domDfd,
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
  if (tags) {  //at  tags.json
    User.id = tags[1];
    searchDataDfd = Hatena.searchData();
    (myNameDfd = Hatena.myName()).done(function (json) {
      User.rkm = json.rkm;
      User.rks = json.rks
      User.login = true;
    });
    $(document).ready(function () {//dom ready
      var tagText = $('pre').text();
      $('body').empty();
      domDfd.resolve(searchDataDfd);
      $.when(myNameDfd, searchDataDfd).fail(function () {
        alert('not login');
        User.login = false;
      });
      us$.addStyle(TEXT.CSS);
      User.tags = JSON.parse(tagText);
    });
  } else if (myName && myName[1]) { // at my.name if id is selected
    var chawan = myName[1];
    User.id = chawan.slice(8);
    searchDataDfd = Hatena.searchData();
    $(document).ready(function () {//dom ready
      var Text = $('pre').text(), myNameObj = JSON.parse(Text);
      if (myNameObj.login && myNameObj.name === User.id) {
        User.rkm = myNameObj.rkm;
        User.rks = myNameObj.rks
        User.login = true;
        $('body').empty();
        domDfd.resolve(searchDataDfd);
      } else {
        domDfd.reject('not login');
      }
      us$.addStyle(TEXT.CSS);
    });
  } else if (myName) {// if id is not selected

  } else {
    //error
    domDfd.reject('environmental error');
  }
  document.title = '?Chawan';
  window.us$ = us$;
})();
