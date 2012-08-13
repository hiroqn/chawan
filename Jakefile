var exec = require('child_process').exec,
    fs = require('fs'),
    less = require('less'),
    gc = require('GCtrl');
desc('This is the default task.');
task('default', [], function (params) {
});

desc('This is the compile less');
task('less', [], function (params) {
  var parser = new (less.Parser)({
    paths: ['./less'], // Specify search paths for @import directives
    filename: 'chawan.less'
  });
  parser.parse(fs.readFileSync('./less/styles.less', 'utf8'),
      function (err, tree) {
        if (err) { return console.error(err) }
        fs.writeFileSync('compress.css', tree.toCSS({ compress: true }));
        complete();
      });
}, true);

desc('This is the task template file 2 json');
task('template', [], function (params) {
  exec('node build/file2json',
      {timeout: 2000},
      function (error, stdout, stderr) {
        if (error !== null) {
          console.log('exec error: ' + error);
        }
        console.log('end');
        complete();
      });
}, true);
desc('This is the build userscript');
task('us', ['less','template'], function (params) {
  exec('node build/builder.js ../package.us.json',
      {timeout: 2000},
      function (error, stdout, stderr) {
        if (error !== null) {
          console.log('exec error: ' + error);
        }
        console.log('end');
        complete();
      });
}, true);
desc('This is the building javascript');
task('gc', [], function (params) {
  var code = gc.build(process.cwd() + '/src', {
    lf: '\r\n'
  });
  fs.writeFileSync('bin.js', code);
});