const { execSync } = require("child_process");
const fs = require("fs-extra");
const { extname } = require("path");

fs.readdirSync(__dirname)
  .map((i) => __dirname + "/" + i)
  .filter((p) => fs.statSync(p).isDirectory())
  .forEach((directory) => {
    const fonts = {};
    const files = fs
      .readdirSync(directory)
      .filter((i) =>
        [".otf", ".ttf", ".woff", ".woff2", ".woff3", ".eot"].includes(
          extname(i)
        )
      )
      .forEach((filename) => {
        let name = filename.slice(0, -extname(filename).length);
        if (name.includes(".")) {
          name = name.slice(0, -extname(name).length);
        }
        fonts[name] = fonts[name] || {};
        fonts[name][extname(filename).slice(1)] = filename;
      });
    Object.keys(fonts).forEach((label) => {
      const conversions = [];
      const font = fonts[label];

      if ((font.ttf || font.otf) && !font.woff) {
        const from = directory + "/" + (font.ttf || font.otf);
        const to = directory + "/" + label + ".woff";
        conversions.push({ from, to });
      }

      if (!font.otf && font.ttf) {
        const from = directory + "/" + font.ttf;
        const to = directory + "/" + label + ".otf";
        conversions.push({ from, to });
      }

      if (!font.ttf && font.otf) {
        const from = directory + "/" + font.otf;
        const to = directory + "/" + label + ".ttf";
        conversions.push({ from, to });
      }

      if (conversions.length) {
        try {
          fs.removeSync(directory + "/styles.css");
        } catch (e) {}
      }
      for (const { from, to } of conversions)
        execSync(`fontforge -lang=ff -c 'Open($1);Generate($2)' ${from} ${to}`);
    });
    //
  });
