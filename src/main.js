var Config = require('./config.js'),
    config = new Config(),
    CSS = require('./css.js').css;

if (window.location.search === '?config') {
  document.addEventListener("DOMContentLoaded", function () {
    var preTag = document.body.children.item(0),
        myNameJSON = JSON.parse(preTag.innerHTML);
    if (!myNameJSON.login) {
      return config.askLogin('http://b.hatena.ne.jp/my.name?config');
    }
    addStyle(CSS);
    var View = require('./view.js');
    config.setByJSON(myNameJSON);
    new View.Config({
      model: config,
      el: document.body
    });
  });
} else {
  if (window.location.pathname === '/my.name') {
    if (config.isSatisfied()) {
      document.addEventListener("DOMContentLoaded", function () {
        var preTag = document.body.children.item(0),
            myNameJSON = JSON.parse(preTag.innerHTML);
        if (!myNameJSON.login) {
          return config.askLogin('http://b.hatena.ne.jp/my.name');
        }
        addStyle(CSS);
        document.title = '?Chawan';
        var Ctrlr = require('./controller.js');
        new Ctrlr(config);

      });
    } else {
      window.location.href += '?config';
    }
  }
}
/**
 * @param css
 */
function addStyle(css) {
  if (typeof GM_addStyle != "undefined") {
    GM_addStyle(css);
  } else {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.getElementsByTagName('head')[0].appendChild(style);
  }
}
//document.addEventListener("DOMContentLoaded", onLoadCallback, false);
