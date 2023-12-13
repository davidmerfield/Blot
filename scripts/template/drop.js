const get = require("../get/template");
const Template = require("models/template");

const main = (templateID, callback) => {
  const [owner, name] = templateID.split(":");
  console.log("dropping template", owner, "from", name);
  //   Template.drop(owner, name, function (err) {
  //     if (err) return callback(err);
  //     console.log("dropped template", templateID);
  //     callback();
  //   });
};

if (require.main === module) {
  get(process.argv[2], function (err, user, blog, template) {
    if (err) throw err;
    main(template.id, function (err) {
      if (err) throw err;
      process.exit();
    });
  });
}

module.exports = main;
