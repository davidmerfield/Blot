var fs = require('fs-extra');
var cheerio = require('cheerio');
var helper = require('helper');
var slug = helper.makeSlug;
var finder = require('finder');
var forEach = helper.forEach;
var rootDir = helper.rootDir;
var _convert = require('marked');
var source = rootDir + '/notes/documentation';
var output = rootDir + '/app/site/views/help/help.json';
var watcher = require('watcher');
var mustache = require('mustache');

// var joinpath = require('path').join;
// var basename = require('path').basename;
// var _convert = require('../../app/models/entry/build/file/markdown/convert');
// var metadata = require('../../app/models/entry/build/metadata');
// var href_index = {};

main(function(err){
  
  if (err) throw err;
  
  // This will watch the documentation directory for any changes
  // while the script is running. If it detects any change, the 
  // callback function is invoked.  
  watcher(source, function(){

    if (err) throw err;

    // For some reason I must call main directly, and not
    // merely pass it to the watcher as a callback. Otherwise
    // it will keep returning the same JSON as the first time
    // it is called. I don't quite understand why?
    main(function(err){

      if (err) throw err;
    });
  });
});

function convert (html, callback) {

  html = _convert(html);

  var $ = cheerio.load(html);
  var subsection_ids = {};

  $('pre').each(function(i, el){
    
    var lang = $(el).children('code').first().attr('class');

    if (lang) lang = lang.split('lang-').join('');

    $(el).addClass(lang);
  });

  // Wrap each subsection in its own container
  // div to make it easy to link to, and store
  // the IDs of these subsections to prevent broken
  // links inside the documentation.
  $('h2').each(function(i, el){

    var subsection_id, subsection_elements, subsection_html;

    subsection_id = $(el).attr('id');
    subsection_elements = $(el).nextUntil('h2').add(el);

    $(el).removeAttr('id');

    subsection_html = '<div id="' + subsection_id + '">' + $.html(subsection_elements) + '</div>';

    subsection_ids[subsection_id] = '#' + subsection_id;

    $(subsection_elements)
      .before(subsection_html)
      .remove();
  });

  html = $.html();

  finder(html, function(err, html){

    if (err) return callback(err);

    callback(null, html, subsection_ids);
  });
}

function title_from_filename (str) {
  str = str.slice(str.indexOf('.') + 2);
  str = str.split('.txt').join('');
  return str;
}

function verify_internal_links (section, href_index) {

var html = '';

section.subsections.forEach(function(subsection){
var $ = cheerio.load(subsection.html);

$('a').each(function(i, el){
        
  var href = $(el).attr('href');

  if (!href) return;

  if (href.indexOf('{{') === -1) return;

  href = href.split('{').join('').split('}').join('');

  if (href_index[href] === undefined) {
    var err = new Error("Broken internal link to {{{" + href + "}}} in file\n" + source + '/' + section.path + '/' + subsection.path);
    throw err;
  }
    
});});



}

function main (callback) {

  var sections = [], folder_names, section_titles;
  var help = {};
  var urls = {};

  // Ignore dotfiles and dashfiles
  folder_names = fs.readdirSync(source).filter(function(n){
    return n[0] !== '.' && n[0] !== '-';
  });

  // Strip leading numbers and period
  section_titles = folder_names.map(title_from_filename);
  
  var href_index = {};

  forEach(folder_names, function(folder_name, next_folder){

    var section_title = title_from_filename(folder_name);
    var section_slug = slug(section_title);

    var subsection_names = fs.readdirSync(source + '/' + folder_name).filter(function(n){
      return n[0] !== '.' && n[0] !== '-';
    });

    var subsections = [];

    forEach(subsection_names, function(subsection_name, next_subsection){

      var subsection_title = title_from_filename(subsection_name);
      var subsection_slug = slug(subsection_title);
      var subsection = fs.readFileSync(source + '/' + folder_name + '/' + subsection_name, 'utf-8');
      var subsection_url = '/help/' + section_slug + '#' + subsection_slug;

      convert(subsection, function(err, subsection, subsection_ids){
    
        subsection = '<div id="' + subsection_slug + '">' + subsection + '</div>';

        urls[subsection_slug] = subsection_url;

        for (var i in subsection_ids)
          href_index[i] = '/help/' + section_slug + subsection_ids[i];

        subsections.push({
          title: subsection_title,
          slug: subsection_slug,
          url: subsection_url,
          html: subsection,
          path: (subsection_name)
        });

        next_subsection();
      });

    }, function(){

      var section = {
        title: section_title,
        slug: section_slug,
        subsections: subsections,
        path: folder_name
      };

      sections.push(section);

      help[section_slug] = section;

      next_folder();
    });

  }, function(){

    var sidebar = [];

    sections.forEach(function(section){

      // verify there are no broken internal links in the docs
      verify_internal_links(section, href_index);

      // render the internal links in the documentation
      section.subsections.forEach(function(subsection){
        subsection.html = mustache.render(subsection.html, href_index);
      });

      section = JSON.parse(JSON.stringify(section));

      if (section.title.toLowerCase().indexOf('guides') > -1 || 
          section.title.toLowerCase().indexOf('account') > -1)
        section.subsections = [];

      sidebar.push(section);
    });

    help.sections = sections;
    help.sidebar =  sidebar;
    help.urls = urls;
    
    console.log('... Built help page view');
    fs.outputJson(output, help, callback);
  });
}