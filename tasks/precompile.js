var fs = require('fs'),
  readFiles = require('./readfile.js');

readFiles('src/templates/').then(function (data){

  fs.writeFile("./dist/js/templates.js", 'var templates = ' + JSON.stringify(data), function(err) {

    if(err) {
        return console.log(err);
    }

  });

});