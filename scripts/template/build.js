var watcher = require('watcher');
var config = require('config');

build();

if (config.environment === 'development') {
  process.stdin.resume();
  console.log('Watching public directory for changes');
  watcher(TEMPLATEDIR, build);
}


  var templateDirs = fs.readdirSync(TEMPLATEDIR);
if (templateName.slice(0, 1) === '.') return next();
if (templateName === '_') return next();
if (templateName === 'README.txt') return next();
if (templateName === 'README.md') return next();
var dir = TEMPLATEDIR + templateName + '/';

  async.each(templateDirs,
var TEMPLATEDIR = __dirname + '/../../templates/';
var defaultDir = TEMPLATEDIR + '_/';
var defaultInfo = JSON.parse(fs.readFileSync(TEMPLATEDIR + '_/package.json', 'utf-8'));
fs.readdir(defaultDir, extractViews(defaultDir));

extend(info)
  .and(defaultInfo);
