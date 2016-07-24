var fs = require('fs');
var helper = require('../../app/helper');
var makeSlug = helper.makeSlug;
var titlify = helper.titlify;
var helpDir = require('path').resolve(__dirname + '/../../app/views/help');
var sourceDir = helpDir + '/src';
var cheerio = require('cheerio');
var extractMetadata = require('../../app/models/entry/build/metadata');
var plugins = require('../../app/plugins');
var convert = require('../../app/models/entry/build/file/markdown/convert');
var OUTPUT = helpDir + '/help.json';

if (require.main === module) {

  build();
  console.log('Watching help dir for changes.');

  fs.watch(sourceDir, function(){
    console.log('Change detected, rebuilding');
    build();
  });

}

function build (callback) {

  callback = callback || function(){};

  fs.readdir(sourceDir, function(Err, files){

    var finalJSON = {};
    var total = 0;

    (function read (files) {

      var fileName = files.shift();

      // Ignore hidden files...
      if (fileName.slice(0, 1) === '.') return read(files);

      console.log('Processing: ' + fileName);
      var path = sourceDir + '/' + fileName;

      // Remove leading number and period
      var title = titlify(fileName.slice(2));

      var section = {
        title: title,
        slug: makeSlug(title),
        html: '',
        questions: []
      };

      fs.readFile(path, 'utf-8', function(err, contents){

        var blog = {id: '0', plugins: plugins.defaultList};
        var parsed = extractMetadata(contents);

        var metadata = parsed.metadata;

        contents = parsed.contents;

        for (var i in metadata)
          section[i] = metadata[i];

        convert(contents, function(err, html){

          plugins.convert(blog, path, html, function(err, html){

            section.html = makeSection(html);

            finalJSON[++total] = section;

            if (!files.length) fs.writeFile(OUTPUT, JSON.stringify(finalJSON, null, ' '), function(){
              return callback();
            });

            if (files.length) read(files);
          });
        });
      });
    }(files));
  });
}

function makeSection (html) {

  var links = [];

  var $ = cheerio.load(html, {decodeEntities: false});

  var id = 1;

  $('h1, h2, h3').each(function(i, eq){

    var text = $(this).text(),
        slug = text.split(' ').join('-').toLowerCase();

    links.push({
      slug: slug,
      isHeading: eq.name === 'h1' ? 'isHeading' : '',
      title: text
    });

    $(this).attr('id', slug);
    // $(this).append('<a class="permalink" href="#' + slug + '">8</a>');

    // wrap each question in a node
    if (eq.name === 'h2') {
      var nextChildren = $(this).nextUntil('h1,h2');
      $(this).before('<div class="question" id="' + id +'-' + slug.split('?').join('') + '">').prev().append(this).append(nextChildren);
      id++;
    }
  });

  return $.html();
}

module.exports = build;