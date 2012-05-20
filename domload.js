us$.dom.then(function (dataDeferred) { // DOMContentLoaded
  var body = $('body'), // cache body element
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
        window.app.set('path', _(path.split('/')).map(function (str) {
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
  //data setter
  dataDeferred.then(function (text) {
    app.setText(text);
  }, function () {
    alert('cant get searchData ');
  });
  //scroll majik
  var flag = false;
  var debounce = _.debounce(function () {
    body.removeClass('majik');
    flag = false;
  }, 600);
  var scrollMajik = _.throttle(function () {
    if (flag) {
      debounce();
    } else {
      _.defer(function () {
        body.addClass('majik');
      });
      flag = true;
      debounce();
    }
  }, 400);
  $(window).scroll(scrollMajik);
}, function (str) {//on error
  alert(str);
});