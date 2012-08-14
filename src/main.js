var HatenaClient = require('./hatena_client.js'),
    SettingJSON = localStorage.getItem('chawan');

function askLogin(escapedLocation, name, password) {
  window.location.href = 'https://www.hatena.ne.jp/login?'
  	  + 'location=' + escapedLocation + (name ? ('&name=' + name) : '')
  	  + (password ? ('&password=' + password) : '');
}

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
    	}
      });
      var client = new HatenaClient(Setting.name, Setting.rks);
    } else {
      window.location.href = '?config';
    }
  }
}

//document.addEventListener("DOMContentLoaded", onLoadCallback, false);
