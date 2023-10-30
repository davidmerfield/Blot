const mustache = require("mustache");
const fs = require("fs-extra");
const { basename, resolve } = require("path");

module.exports = async (conf, locals) => {
  await fs.emptyDir(__dirname + "/data");

  locals.user = process.env.BLOT_OPENRESTY_TEST_USER || "David";
  locals.group = process.env.BLOT_OPENRESTY_TEST_GROUP || "staff";

  locals.cache_directory = __dirname + "/data/cache-" + basename(conf, ".conf");
  locals.lua_directory = resolve(__dirname + "/../");
  locals.data_directory = __dirname + "/data";

  const config = await fs.readFile(conf, "utf8");

  const result = mustache.render(config, locals);

  await fs.mkdir(locals.cache_directory);
  await fs.outputFile(__dirname + "/data/" + basename(conf), result, "utf8");

  return __dirname + "/data/" + basename(conf);
};
