var fs = require('fs'),
  Ractive = require('ractive');

module.exports = function( dirname ) {

  return new Promise(function ( resolve, reject ) {

    return fs.readdir(dirname, function(err, filenames) {

      var data = {}
        counter = 0;

      if (err) {
        return reject(err);
      }

      return filenames.forEach(function(filename) {

        return fs.readFile(dirname + filename, 'utf-8', function(err, content) {

          if (err) {
            return reject(err);
          }

          data[filename.replace('.handlebars', '')] = Ractive.parse(content);

          counter++;

          if ( counter === filenames.length ) {

            resolve(data);

          }

        });

      });


    });

  });

};