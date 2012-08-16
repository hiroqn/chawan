var Kls = require('kls'),
    Backbone = require('backbone'),
    Model = require('./model.js'),
    Tree = require('./tree.js');

var Ctrlr = Kls.derive(function (client, setting) {
  var self = this,
      View = require('./view.js'),
      decode = decodeURIComponent,
      path2Array = function (path) {return path.split('/').map(decode);};
  this.client = client;
  this.setting = setting;
  this.router = new (Backbone.Router.extend({
    routes: {
      "": function () { self.router.navigate('!');},
      "!": this.moveTo.bind(this, []),
      "!*path": function (path) {self.moveTo(path2Array(path));}
    }
  }))();
  this.app = new Model.App();
  var appView = new View.App({
    model: this.app,
    el: document.body
  });
});
Ctrlr.mixin({
  moveTo: function (path) {
    this.app.set('path', path);
    //    this.router.navigate
  }
});
module.exports = Ctrlr;
