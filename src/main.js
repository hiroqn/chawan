var HatenaClient = require('./hatena_client.js'),
    SettingJSON = localStorage.getItem('chawan');


var Setting = JSON.parse(SettingJSON || '{}');
if (window.location.search === '?config') {
  document.addEventListener("DOMContentLoaded", function () {
    var preTag = document.body.children.item(0),
        myNameJSON = JSON.parse(preTag.innerHTML);
    alert
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
      var client = new HatenaClient(Setting.name, Setting.rks)
    } else {
      window.location.href = '?config';
    }
  }
}

//document.addEventListener("DOMContentLoaded", onLoadCallback, false);
