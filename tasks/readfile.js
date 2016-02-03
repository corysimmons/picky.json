var fs = require('fs'),
  Ractive = require('ractive');

module.exports = function( dirname ) {

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
