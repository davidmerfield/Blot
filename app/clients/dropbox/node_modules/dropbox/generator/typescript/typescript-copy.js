var fs = require('fs');
var path = require('path');
var outDir;

if (process.argv.length !== 3) {
  console.error('Expected a destination directory as input');
  process.exit(1);
}

outDir = process.argv[2];
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// Sanity check.
if (!fs.existsSync(path.join(__dirname, 'dropbox.d.ts'))) {
  console.error('TypeScript definition files are missing! Please run generate_routes.py before running this script.');
  process.exit(1);
}

// Copy all of the .d.ts files in this directory to /dist.
fs.readdirSync(__dirname).filter(function (file) {
  return /\.d\.ts$/.test(file);
}).forEach(function (file) {
  fs.writeFileSync(path.join(outDir, file), fs.readFileSync(path.join(__dirname, file)));
});
