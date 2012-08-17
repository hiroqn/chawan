var HatenaClient = require('./hatena_client.js'),
    CSS = require('./css.js').css;

var Setting = JSON.parse(localStorage.getItem('chawan') || '{}');
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
    } else {
      askLogin('http%3A//b.hatena.ne.jp/my.name%3Fconfig');
    }
  }, false);
} else {
  if (window.location.pathname === '/my.name') {
    if (Setting.name && Setting.rks) {
      document.addEventListener("DOMContentLoaded", function () {
        var preTag = document.body.children.item(0),
            myNameJSON = JSON.parse(preTag.innerHTML);
        if (!myNameJSON.login) {
          askLogin('http%3A//b.hatena.ne.jp/my.name%3Fconfig',
              Setting.name, Setting.password);
          return null;
        }
        addStyle(CSS);
        var Ctrlr = require('./controller.js');
        window.ctrlr = new Ctrlr(client, Setting);
      });
      var client = new HatenaClient(Setting.name, Setting.rks);
      client.searchData(function (err, text) {
        document.addEventListener("DOMContentLoaded", function () {
          window.ctrlr
        })
      });
    } else {
      window.location.href = '?config';
    }
  }
}
/**
 * @param escapedLocation
 * @param [name]
 * @param [password]
 */
function askLogin(escapedLocation, name, password) {
  window.location.href = 'https://www.hatena.ne.jp/login?'
                             + 'location=' + escapedLocation +
                         (name ? ('&name=' + name) : '')
      + (password ? ('&password=' + password) : '');
}
/**
 * @param css
 */
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
