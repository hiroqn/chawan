var Kls = require('kls'),
    $ = require('jQuery'),
    BASE_URL = 'http://b.hatena.ne.jp/';

var HatenaClient = Kls.derive(function (id, rks) {
  this.id = id;
  this.rks = rks;
});
HatenaClient.mixin({
  editComment: function (bookmarkUrl, comment) {
    var data = {
      url: bookmarkUrl,
      comment: comment,
      from: 'inplace',
      rks: this.rks
    };
    return  $.post(BASE_URL + this.id + '/add.edit.json', data, null, 'json');
  },
  deleteBookmark: function (bookmarkUrl) {
    var data = {url: bookmarkUrl, rks: this.rks};
    return $.post(BASE_URL + this.id + '/add.edit.json', data, null, 'json');
  },
  searchData: function () {
    return $.post(BASE_URL + this.id + '/search.data', null, null, 'text');
  },
  myName: function () {
    return $.get(BASE_URL + '/my.name', null, null, 'json');
  }
});

module.exports = HatenaClient;
