var exec = require('child_process').exec,
    fs = require('fs'),
    less = require('less'),
    gc = require('GCtrl');
desc('This is the default task.');
task('default', ['less', 'gc'], function (params) {
});

desc('This is the compile less');
task('less', [], function (params) {
  var parser = new (less.Parser)({
    paths: ['./less'], // Specify search paths for @import directives
    filename: 'chawan.less'
  });
  parser.parse(fs.readFileSync('./less/chawan.less', 'utf8'),
      function (err, tree) {
        if (err) { return console.error(err) }
        var script = 'exports.css = ';
        script += JSON.stringify(tree.toCSS({ compress: true })) + ';';
        fs.writeFileSync('src/css.js', script);
        console.log('compile less');
        complete();
      });
}, true);

desc('This is the task template file 2 json');
task('template', [], function (params) {
  var map = {};
  fs.readdirSync('./template').forEach(function (p) {
    map[p.slice(0, -4)] = fs.readFileSync('template/' + p, 'utf8');
  });
  fs.writeFileSync('src/file.js',
      'module.exports = ' + JSON.stringify(map) + ';');
  console.log('template end');
});

desc('This is the task build javascript');
task('gc', ['template'], function (params) {
  var code = gc.build(process.cwd() + '/src', {
    lf: '\r\n'
  });
  var meta = fs.readFileSync('meta.js', 'utf8');
  fs.writeFileSync('chawan.user.js', meta + code);
  console.log('script compiles');
});
