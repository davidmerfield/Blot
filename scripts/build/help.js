var fs = require('fs');
var helper = require('helper');
var makeSlug = helper.makeSlug;
var forEach = helper.forEach;
var rootDir = helper.rootDir;
var joinpath = require('path').join;
var basename = require('path').basename;
var render = require('mustache').render;
var convert = require('../../app/models/entry/build/file/markdown/convert');

var source = rootDir + '/app/docs';
var output = rootDir + '/app/site/views/help/sections';

var overview_source = rootDir + '/app/site/views/help/overview.src.html';
var overview_output = rootDir + '/app/site/views/help/overview.html';

var sidebar_source = rootDir + '/app/site/views/help/sidebar.src.html';
var sidebar_output = rootDir + '/app/site/views/help/sidebar.html';

var sections = [];

forEach(readdir(source), function(path, next){

  // Remove leading number and period
  var title = basename(path).slice(2).trim();
  var slug = makeSlug(title);
  var content = '# ' + title + '\n\n' + loadFiles(path);

  convert(content, function(err, html){

    var output_path = joinpath(output, slug + '.html');

    write(output_path, html);

    sections.push({html: html, title: title, slug: slug});

    next();
  });

}, function(){

  var overview_template = fs.readFileSync(overview_source, 'utf-8');

  overview_template = render(overview_template, {sections: sections});

  fs.writeFileSync(overview_output, overview_template, 'utf-8');

  var sidebar_template = fs.readFileSync(sidebar_source, 'utf-8');

  sidebar_template = render(sidebar_template, {sections: sections});

  fs.writeFileSync(sidebar_output, sidebar_template, 'utf-8');

  console.log('Help built!');
});



function write (path, contents) {
  return fs.writeFileSync(path, contents, 'utf-8');
}

function read (path) {
  return fs.readFileSync(path, 'utf-8');
}

function readdir (path) {

  var contents = fs.readdirSync(path);

  contents = contents.filter(function(name){
    return name[0] !== '.' && name[0] !== '-';
  });

  contents = contents.map(function(name){
    return joinpath(path, name);
  });

  return contents;
}

function loadFiles (path) {

  var res = '';

  var contents = readdir(path);

  for (var i = 0; i < contents.length;i++)
    res += read(contents[i]) + '\n\n';

  return res;
}