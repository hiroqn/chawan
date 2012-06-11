#!/usr/bin/env node
var exec = require('child_process').exec;
var fs = require('fs');

exec('lessc chawan.less -x',
    {timeout: 1000},
    function(error, stdout, stderr) {
      fs.writeFileSync('./compress.css', stdout);
      exec('node builder.js pack.json',
          {timeout: 1000},
          function(error, stdout, stderr) {
            fs.unlinkSync('./compress.css');
            if(error !== null) {
              console.log('exec error: '+error);
            }
            console.log('end');
          });
      if(error !== null) {
        console.log('exec error: '+error);
      }
    });