var sites = fs.readFileSync(__dirname + '/sites.txt', 'utf-8').split('\n');
var async = require('async');

async.each(sites, function(site, next){

});

