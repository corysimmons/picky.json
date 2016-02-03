var Ractive = require('ractive'),
  path = require('path'),
  fs = require('fs');

function readFiles(dirname, onDone, onError) {

  return new Promise(function ( resolve, reject ) {

    return fs.readdir(dirname, function(err, filenames) {

      var data = {};

      if (err) {
        return reject(err);
      }

      return filenames.forEach(function(filename, index) {

        return fs.readFile(dirname + filename, 'utf-8', function(err, content) {

          if (err) {
            return reject(err);
          }

          data[filename.replace('.handlebars', '')] = Ractive.parse(content);

          if ( index === filenames.length - 1 ) {

            resolve(data);

          }

        });

      });


    });

  });

}

readFiles('src/templates/').then(function (data){

  fs.writeFile("./dist/js/templates.js", 'var templates = ' + JSON.stringify(data), function(err) {

    if(err) {
        return console.log(err);
    }

  });

});