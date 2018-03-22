var helper = require('helper');
var forEach = helper.forEach;
var Blog = require('blog');
var url_parser = require('url').parse;
var dns = require('dns');
var BLOT_IP = '54.191.179.131';

var RESULT;

function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1);
}

// Add new sites at the start

var sites = [

  ["www.matthewbattles.org", "Matthew Battles directs <a href='https://metalabharvard.github.io/'>metaLAB</a> at Harvard. Matthew’s website"],
  ["hannautkin.com", "Hanna Utkin is a filmmaker and producer from New York City. Hanna’s website"],
  ["sportsmanfc.com", "The Sportsman Flying Club is a pigeon‐racing club in Toft Hill, UK. Their website"],
  
  ["tf2.blot.im", "Theo Francis is a reporter at The Wall Street Journal. Theo’s blog"],
  ["fagerheimen.no", "Fagerheimen Borettslag is an apartment building in Oslo, Norway. Its website"],
  ["www.rebeccatron.com", "Rebecca Kukshtel is an engineer at Betterment in New York City. Rebecca "],

  ["www.jacobyyoung.com/about", "Jacoby Young works at Kapālama Elementary School in Hawaii. Jacoby"],
  ["www.kristianhjelle.com", "Kristian Hjelle is a designer and partner at Bakken & Bæck. Kristian"],
  ["www.alexgibson.nyc", "Alexander Gibson is an artist from New York City. Alexander’s website"],
    
  ["blog.aurynn.com", "Aurynn Shaw is a writer and engineer from New Zealand. Aurynn’s site"],
  ["john.pavlusoffice.com", "John Pavlus is a nonfiction writer and filmmaker based in Portland, Oregon. John"],
  ["www.theliminal.co", "The Liminal is a podcast about metaphysical speculation. Their website"],

  ["kiefer.design", "Kiefer Sutherland is a freelance designer and art director. Kiefer’s website"],
  ["www.failuretolerated.com", "Sean McCoy is a game designer from Dallas, Texas. Sean’s site"],
  ["mrfris.by", "Stuart Frisby is the Director of Design at Booking.com. Stuart’s site"],
  ["www.querlin.com", "Querlin Ricci is a designer in Atlanta. Querlin’s website"],
];

module.exports = function (callback) {

  if (RESULT) return callback(null, RESULT);

  var result = [];

  // Only show the first 9 sites on the homepage
  sites = sites.slice(0, 9);

  forEach(sites, function(site, next){
      
    var parsed_URL = url_parser('https://' + site[0]);

    var domain = parsed_URL.host;
    var description = site[1].trim();
    var template;
    var is_subdomain = domain.indexOf('blot.im') !== -1;
    var url, display_url, protocol, by, custom_template, template_name;

    dns.lookup(domain, function(err, res) {

      if (!is_subdomain && res !== BLOT_IP) {
        console.log(domain, 'is not on blot it points to', res);
        return next();
      }

      if (is_subdomain) {
        by = {handle: domain.split('.blot.im').join('')};
      } else {
        by = {domain: domain};
      }

      Blog.get(by, function(err, blog){

        if (err || !blog) {
          console.log(domain, 'is not in the database');
          return next();
        } 

        template = blog.template;

        protocol = domain.indexOf('blot.im') > -1 ? 'http' : 'https';

        url = protocol + '://' + site[0];
        display_url = domain.split('www.').join('');
        custom_template = template.indexOf('SITE') === -1;
        template_name = custom_template ? 'custom' : capitalize(template.split('SITE:').join(''));

        description += ' uses ';
        description += custom_template ? 'a' : 'the';
        description += ' <a href="/configuring">' + template_name + '</a> template.';


        // Redirect
        if (display_url === 'john.pavlusoffice.com') display_url = 'johnpavlus.com';

        result.push({
          url: url,
          first: result.length === 0,
          clear: (result.length + 1) % 3 === 0,
          display_url: display_url,
          description: description,
          domain: domain,
          template: template
        });

        next();
      });
    });


  }, function(){

    RESULT = result;
    callback(null, result);
  });
};