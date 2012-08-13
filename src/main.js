var HatenaClient = require('./hatena_client.js'),
    SettingJSON = localStorage.getItem('chawan');
if (SettingJSON) {
  var Setting = JSON.parse(SettingJSON);
  if (Setting.id && Setting.rks) {
    var client = new HatenaClient(Setting.id, Setting.rks)
  }
} else {

}

document.addEventListener("DOMContentLoaded", function () {
  var preTag = document.body.children.item(0);
  preTag.innerHTML;
}, false);
