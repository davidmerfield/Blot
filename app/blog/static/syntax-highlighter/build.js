const fs = require("fs-extra");
const directory = __dirname + "/themes";
const titleCase = require("helper/titlecase");
const MinifyCSS = require("clean-css");

fs.outputJsonSync(
  __dirname + "/index.json",
  fs
    .readdirSync(directory)
    .filter((i) => i.endsWith(".css"))
    .map((filename) => {
      const minimize = new MinifyCSS({ level: 2 });
      const id = filename.slice(0, -".css".length);
      const styles = minimize.minify(
        fs.readFileSync(`${directory}/${filename}`, "utf8")
      ).styles;

      const name = titleCase(id.split("-").join(" "));
      return {
        name,
        id,
        styles,
      };
    }),
  { spaces: 2 }
);
