// https://www.are.na/alex-singh/assorted-design-references
// https://www.are.na/james-hicks/vaporwave
// https://www.are.na/steve-k/neon-plants-and-lava-lamps
// https://www.are.na/michael-duong/urban-outfitters-tarkovsky

if (require.main === module) {
  var url = process.argv[2];
  var output_directory = process.argv[3];

  if (!url) throw "No url";
  if (!output_directory) throw "No output_directory";

  var slug = parse_slug(url);

  main(slug, output_directory, function(err) {
    if (err) throw err;

    console.log("Done!");
    process.exit();
  });
}

function main(slug, output_directory, callback) {
  fetch(slug, function(err, posts) {
    fs.emptyDir(output_directory, function(err) {
      parse(posts, callback);
    });
  });
}

function parse_slug(url) {
  return require("url")
    .parse(url)
    .path.split("/")
    .pop();
}

module.exports = main;
