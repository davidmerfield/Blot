var redisSearch = require("helper").redisSearch;
var colors = require("colors/safe");

if (require.main === module) {
  var searchTerm = process.argv[2];

  if (!searchTerm) throw new Error("Please pass search query as first arg");

  redisSearch(searchTerm, function(err, res) {
    if (err) throw err;
    res.map(function(item) {
      var val = item.value;
      var key = item.key;
      var res = colors.dim(item.type) + " " + key;

      val = val.split(searchTerm).join(colors.white(searchTerm));
      res += " " + colors.dim(val);
      console.log(res);
    });
    process.exit();
  });
}
