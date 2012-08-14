var HatenaClient = require('./hatena_client.js'),
    SettingJSON = localStorage.getItem('chawan');

var Setting = JSON.parse(SettingJSON || '{}');
if (window.location.search === '?config') {
  document.addEventListener("DOMContentLoaded", function () {
    var preTag = document.body.children.item(0),
        myNameJSON = JSON.parse(preTag.innerHTML);
    if (myNameJSON.login) {
      var View = require('./view.js'), Config = require('./config.js');
      var configView = new View.Config({
        model: new Config(Setting, myNameJSON),
        el: document.body
      });
    }
  }, false);
} else {
  if (window.location.pathname === '/my.name') {
    if (Setting.name && Setting.rks) {
      var client = new HatenaClient(Setting.name, Setting.rks);
//      client.searchData(function (text) {});
      document.addEventListener("DOMContentLoaded", function () {
        addStyle(require('./css.js').css);//add css
      }, false);
    } else {
      window.location.href = '?config';
    }
  }
}
function addStyle(css) {
  if (GM_addStyle) {
    GM_addStyle(css);
  } else {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.getElementsByTagName('head')[0].appendChild(style);
  }
}
//document.addEventListener("DOMContentLoaded", onLoadCallback, false);
