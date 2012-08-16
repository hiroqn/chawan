var Kls = require('kls'),
    reqwest = require('reqwest');
var BASE_URL = 'http://b.hatena.ne.jp/';
var HatenaClient = Kls.derive(function (id, rks) {
  this.id = id;
  this.rks = rks;
  this.searchURL = 'http://b.hatena.ne.jp/' + id + '/search.data';
});
HatenaClient.mixin({
  editComment: function (bookmarkUrl, comment, callback) {
    var postData = {
      url: bookmarkUrl,
      comment: comment,
      from: 'inplace',
      rks: this.rks
    };
    reqwest({
      url: BASE_URL + this.id + '/add.edit.json',
      method: 'post',
      data: postData,
      type: 'json',
      success: function (json) {
        if (json.success) {
          callback(null, json.comment_raw)
        }
      }
    });
  },
  deleteBookmark: function (bookmarkUrl, callback) {
    reqwest({
      url: BASE_URL + this.id + '/add.delete',
      method: 'post',
      data: {url: bookmarkUrl, rks: this.rks},
      type: 'json',
      success: function (json) {
        if (json.success) {
          callback(null, json)
        }
      }
    });
  },
  searchData: function (callback) {
    reqwest({
      url: BASE_URL + this.id + '/search.data',
      method: 'post',
      type: 'text',
      success: function (text) {
        callback(null, text)
      }
    });
  },
  myName: function (callback) {
    reqwest({
      url: BASE_URL + '/my.name',
      method: 'get',
      type: 'json',
      success: function (json) {
        if (json.login) {
          callback(null, json)
        }
      }
    });
  }
});

module.exports = HatenaClient;
