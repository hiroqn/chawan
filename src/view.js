var Backbone = require('backbone'),
    template = require('./template.js');
Backbone.$ = require('jQuery');

exports.Config = Backbone.View.extend({
  events: {
    "click .save": "save",
    "click .cancel": "cancel"
  },
  template: template.config,
  initialize: function () {
    this.render();
  },
  render: function () {
    this.$el.html(this.template(this.model));
    //    this.$el.show();
    return this;
  },
  save: function () {
    var text = this.$('.config-input').val();
    this.model.setCondition(text);
    localStorage.chawan = JSON.stringify(this.model.getSaveData());
    //      this.model.set('config')

    console.log('saved'); // TODO add save notification
  },
  cancel: function () {
    //    this.render();
  }
});
