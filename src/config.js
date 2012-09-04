var Kls = require('kls');
/**
 * manage localStorage and classify rule
 * @type {*}
 */
var Config = module.exports = Kls.derive(function () {
  var local = JSON.parse(localStorage.chawan || '{}');
  this.name = local.name;
  this.rks = local.rks;
  this.text = local.text;
  this.password = local.password;
  this.rule = local.rule;
});
Config.mixin({
  isSatisfied: function () {
    return !!(this.name && this.rks);
  },
  setCondition: function (text) {
    this.text = text;
    this.rule = this._parser(text);// todo rename
  },
  setByJSON: function (json) {
    if (!(this.name && this.rks)) {
      this.name = json.name;
      this.rks = json.rks;
    }
  },
  save: function () {
    localStorage.chawan = JSON.stringify(this);
  },
  askLogin: function (redirectURL) {
    var param = 'location=' + encodeURIComponent(redirectURL) +
                (this.name ? ('&name=' + this.name) : '') +
                (this.password ? ('&password=' + this.password) : '');
    window.location.href = 'https://www.hatena.ne.jp/login?' + param;
  }
});
var configParam = /^\[[^%\/\?\[\]]+\](?:(?:\*|\+)\[[^%\/\?\[\]]+\])*$/;
function tokenizer(text) {
  if (text.match(configParam)) {
    return text.slice(1, -1).split(/\]\+\[/).map(function (chunk) {
      return chunk.split(/\]\*\[/);
    });
  } else {
    throw new Error('Syntax Error');
  }
}

function Condition(name) {
  name = name.replace(/^\s+|\s+$/g, '');
  if (name.match(/-$/)) {
    this.exclude = true;
    name = name.slice(0, -1);
  }
  this.condition = tokenizer(name);
  this.children = [];
  this.name = name;
}
function counter(line) {
  var count = 0;
  while (line.charAt(count) === ' ') {
    count++;
  }
  return count;
}
function parser(text, dir, depth) {
  var condition, index, line, count;
  while (text) {
    index = text.indexOf('\n');
    if (index === -1) {index = text.length}
    count = counter(line = text.slice(0, index));

    if (count < depth) {
      return text;
    }
    if (count === depth + 1) {
      text = parser(text, dir[dir.length - 1].children, depth + 1);
      continue;
    }
    if (count > depth + 1) {
      throw new Error('parse error');
    }
    condition = new Condition(line);
    if (count === depth) {
      dir.push(condition);
      text = text.slice(index + 1);
    }
  }
  return text;
}
Config.mixin({
  _parser: function (text) {
    text = text.replace(/\r\n/, '\n');
    var lines = text.split('\n');
    var root = [];
    parser(text, root, 0);
    return root;
  }
});
