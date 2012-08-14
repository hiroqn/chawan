var Kls = require('kls')


var Config = module.exports = Kls.derive(function (local, response) {
  this.name = local.name || response.name;
  this.rks = local.rks || response.rks;
});
Config.mixin({
  setCondition: function (text) {
    this.text = text;
    this.folder = this._parser(text);// todo rename
  },
  getSaveData: function () {
    return {
      name: this.name,
      rks: this.rks,
      folder: this.folder
    }
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
