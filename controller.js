
function Controller(client){

}
_(Controller.prototype).extend(Backbone.Events,{

});
us$.ready().done(function () {
  us$.addStyle(TEXT.CSS);
  var body = $('body').empty(), // cache body element
      flag = false, // scroll majik
      debounce = _.debounce(function () {
        body.removeClass('majik');
        flag = false;
      }, 600),
      throttle = _.throttle(function () {
        if (!flag) {
          _.defer(function () {
            body.addClass('majik');
          });
          flag = true;
        }
        debounce();
      }, 400),
      appView = new AppView({
        model: app,
        el: document.body
      }), // app View
      router = new (Backbone.Router.extend({
        routes: {
          "": "top",
          "!": "top",
          "!*path": "moveTo",
          "configure": "configure"
        },
        top: function () {
          window.app.set('path', []);
        },
        moveTo: function (path) {
          window.app.set('path', path.split('/').map(function (str) {
            return decodeURIComponent(str);
          }));
        },
        configure: function () {

        }
      }))();
  app.on('change:path', function () {
    router.navigate('!' + app.get('path').join('/'));
  });
  Backbone.history.start();
  $(window).scroll(throttle);

});
us$.ready('normal').done(function (dataDeferd) {
  var myName = JSON.parse($('pre').text());
  if(!myName.login){
    throw new Error('not Login');
  }
  var client = new HatenaClient(myName.name, myName.rks);
});