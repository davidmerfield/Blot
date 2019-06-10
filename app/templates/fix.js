var fs = require("fs-extra");
var dirs = [];
var async = require("async");

fs.readdirSync(__dirname + "/latest").forEach(function(name) {
  if (name[0] === ".") return;
  dirs.push(__dirname + "/latest/" + name);
});

fs.readdirSync(__dirname + "/past").forEach(function(name) {
  if (name[0] === ".") return;
  dirs.push(__dirname + "/past/" + name);
});

async.eachSeries(dirs, fix, function(err) {
  if (err) throw err;
  console.log("Done!");
});

function fix(templateDir, callback) {
  console.log("fixing", templateDir);

  var Package = fs.readJsonSync(templateDir + "/package.json");
  var viewnameDictionary = {};

  if (!Package.views) return callback();

  fs.readdirSync(templateDir).forEach(function(viewname) {
    if (viewname.indexOf(".") === -1) return;
    var name = viewname.slice(0, viewname.lastIndexOf("."));
    if (name[0] === "_") name = name.slice(1);
    viewnameDictionary[name] = viewname;
  });

  // console.log("Dictionary", viewnameDictionary);
  // console.log("Before", Package.views);

  for (var viewnameWithoutExtension in Package.views) {
    if (
      Package.views[viewnameWithoutExtension] &&
      Package.views[viewnameWithoutExtension].type
    )
      delete Package.views[viewnameWithoutExtension].type;

    if (
      Package.views[viewnameWithoutExtension] &&
      Package.views[viewnameWithoutExtension].url &&
      !viewnameDictionary[viewnameWithoutExtension] &&
      Package.views[viewnameWithoutExtension].url ===
        "/" + viewnameWithoutExtension
    )
      delete Package.views[viewnameWithoutExtension].url;

    if (Object.keys(Package.views[viewnameWithoutExtension]).length === 0)
      delete Package.views[viewnameWithoutExtension];

    if (!viewnameDictionary[viewnameWithoutExtension]) continue;

    Package.views[viewnameDictionary[viewnameWithoutExtension]] =
      Package.views[viewnameWithoutExtension];

    delete Package.views[viewnameWithoutExtension];
  }

  // console.log("After", Package.views);

  fs.outputJsonSync(templateDir + "/package.json", Package, { spaces: 2 });
  callback(null);
}
