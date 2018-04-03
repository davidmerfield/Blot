const fse = require('fs-extra');
const glob = require('glob');
const path = require('path');

function cleanForPublish(location=process.cwd(), extensions=['.node', '.pdb']) {
  const savePattern = path.join(location, 'build', '**', `@(*${extensions.join('|*')})`);
  const killPattern = path.join(location, 'build', '**');
  const save = glob.sync(savePattern);
  const kill = glob.sync(killPattern)
    .filter(function(bad) {
      return !save.some(function(good) {
        return good.indexOf(bad) == 0;
      });
    });
  console.log(`cleaning ${kill.length} file(s)`);

  kill.forEach(function(file) {
    fse.removeSync(file);
  });
}
module.exports = cleanForPublish;
