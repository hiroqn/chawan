var exec = require('child_process').exec,
    fs = require('fs');
desc('This is the default task.');
task('default', [], function (params) {
  exec('lessc chawan.less -x',
      {timeout: 2000},
      function(error, stdout, stderr) {
        fs.writeFileSync('./compress.css', stdout);
        exec('node builder.js package.us.json',
            {timeout: 2000},
            function(error, stdout, stderr) {
              fs.unlinkSync('./compress.css');
              if(error !== null) {
                console.log('exec error: '+error);
              }
              console.log('end');
              complete();
            });
        if(error !== null) {
          console.log('exec error: '+error);
        }
      });
},true);