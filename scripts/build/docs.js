var fs = require('fs-extra');
var helper = require('helper');
var slug = helper.makeSlug;
var forEach = helper.forEach;
var rootDir = helper.rootDir;
var joinpath = require('path').join;
var basename = require('path').basename;
var render = require('mustache').render;
var convert = require('../../app/models/entry/build/file/markdown/convert');

var source = rootDir + '/notes/documentation';
var output = rootDir + '/app/site/views/help/help.json';
var watcher = require('watcher');
var metadata = require('../../app/models/entry/build/metadata');

main(function(){
  watcher(source, main);
});

function title_from_filename (str) {
  str = str.slice(str.indexOf('.') + 2);
  str = str.split('.txt').join('');
  return str;
}

function main (callback) {

  var sections = [], folder_names, section_titles;
  var help = {};
  var urls = {};

  // Ignore dotfiles and dashfiles
  folder_names = fs.readdirSync(source).filter(function(n){
    return n[0] !== '.' && n[0] !== '-'
  });

  // Strip leading numbers and period
  section_titles = folder_names.map(title_from_filename);
  
  forEach(folder_names, function(folder_name, next_folder){

    var section_title = title_from_filename(folder_name);
    var section_slug = slug(section_title);

    var sub_section_names = fs.readdirSync(source + '/' + folder_name).filter(function(n){
      return n[0] !== '.' && n[0] !== '-'
    });

    var sub_sections = [];

    forEach(sub_section_names, function(sub_section_name, next_sub_section){

      var sub_section_title = title_from_filename(sub_section_name);
      var sub_section_slug = slug(sub_section_title);
      var sub_section = fs.readFileSync(source + '/' + folder_name + '/' + sub_section_name, 'utf-8');
      var sub_section_url = '/help/' + section_slug + '#' + sub_section_slug;

      convert(sub_section, function(err, sub_section){
    
        sub_section = '<div id="' + sub_section_slug + '">' + sub_section + '</div>';

        urls[sub_section_slug] = sub_section_url;

        sub_sections.push({
          title: sub_section_title,
          slug: sub_section_slug,
          url: sub_section_url,
          html: sub_section
        });

        next_sub_section();
      });

    }, function(){

      var section = {
        title: section_title,
        slug: section_slug,
        sub_sections: sub_sections
      };

      sections.push(section);

      help[section_slug] = section

      next_folder();
    });

  }, function(){

    var sidebar = [];

    sections.forEach(function(section){

      section = JSON.parse(JSON.stringify(section));

      if (section.title.toLowerCase().indexOf('guides') > -1 || 
          section.title.toLowerCase().indexOf('account') > -1)
        section.sub_sections = [];

      sidebar.push(section);
    });

    help.sections = sections;
    help.sidebar =  sidebar;
    help.urls = urls;
      
    console.log(sections);

    fs.outputJson(output, help, callback);
  });
}