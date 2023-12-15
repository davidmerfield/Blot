const get = require("../get/template");
const Template = require("models/template");

const main = (owner, name, callback) => {
  console.log("dropping template", owner, "from", name);
  Template.drop(owner, name, function (err) {
    if (err) return callback(err);
    console.log("dropped template");
    callback();
  });
};

if (require.main === module) {
  if (process.argv[2] && process.argv[3]) {
    return main(process.argv[2], process.argv[3], function (err) {
      if (err) throw err;
      process.exit();
    });
  }

  get(process.argv[2], function (err, user, blog, template) {
    if (err) throw err;
    main(template.id, function (err) {
      if (err) throw err;
      process.exit();
    });
  });
}

module.exports = main;
