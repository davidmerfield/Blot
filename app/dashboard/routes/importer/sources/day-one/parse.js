var async = require("async");
var moment = require("moment");
var fs = require("fs-extra");

module.exports = function(json, outputDirectory, callback) {
  async.eachSeries(
    json.entries,
    function(input, next) {
      var entry = {};

      entry.tags = input.tags || [];
      entry.created = entry.dateStamp = moment
        .utc(input.creationDate)
        .valueOf();
      entry.metadata = {};

      if (input.starred) {
        entry.metadata.Starred = "yes";
      }

      if (input.weather) entry.metadata.Weather = input.weather.weatherCode;
      if (input.location)
        entry.metadata.Coordinates =
          input.location.latitude + ", " + input.location.longitude;

      var id = input.text.match(/!\[\]\(dayone-moment:\/\/([^.\),]+)\)/)[1];
      // console.log(id);

      var image =
        "_images/" +
        input.photos.filter(function(i) {
          return i.identifier === id;
        })[0].md5 +
        ".jpeg";

      // console.log(image);

      input.text = input.text.split("dayone-moment://" + id).join(image);

      // input.text = input.text.split('dayone-moment://F37015BF4E5840F192BE44E13EFCAF23')

      var file = [];

      file.push("Date: " + moment(entry.dateStamp).format('MMMM Do YYYY, h:mm:ss a'));

      for (var i in entry.metadata) file.push(i + ": " + entry.metadata[i]);

      if (file.length) file.push("");
      file.push(input.text);

      file = file.join('\n');

      // console.log(input);
      console.log(entry);

      var lines = input.text.trim().split('\n');

      lines = lines.filter(function(line){
        return line.indexOf('![') === -1 && line.indexOf('://') === -1;
      });

      if (lines.length) slug = lines[0].split('/').join('-').split(' ').join('-').toLowerCase();

      slug = slug.split('.').join('');
      slug = slug.split(',').join('');
      slug = slug.split('/').join('');
      slug = slug.split('/').join('');
      slug = slug.split('\'').join('');
      
      while (slug.indexOf('--') > -1)
        slug = slug.split('--').join('-');

      fs.writeFile(
        outputDirectory + "/" + moment(entry.dateStamp).format('YYYY-MM-DD-') + (slug || 'untitled') + ".txt",
        file,
        next
      );
    },
    callback
  );
};
