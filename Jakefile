var exec = require('child_process').exec,
    fs = require('fs');
desc('This is the default task.');
task('default', ['us'], function (params) {
  fs.unlinkSync('./build/compress.css');
  fs.unlinkSync('./build/file.js');
});

desc('This is the compile less');
task('less', [], function (params) {
  exec('lessc chawan.less -x',
      {timeout: 2000},
      function (error, stdout, stderr) {
        fs.writeFileSync('build/compress.css', stdout);
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