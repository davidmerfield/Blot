var sharp = require('sharp');
var exif = require('exif-reader');

var path = __dirname + '/image.jpg';

// sharp(path)
//   .metadata(function (err, info) {

//     var metadata = exif(info.exif);


//     console.log(err);
//     console.log(metadata);
//   });


  var parser = require('exif-parser').create(require('fs').readFileSync(path));
  var result = parser.parse();
  console.log(result);
