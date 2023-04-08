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
      const font = fonts[label];
      const source = font.ttf || font.otf;
      console.log(directory, label, font);
      if (!font.woff) {
        const from = directory + "/" + source;
        const to = directory + "/" + label + ".woff";
        console.log(" FROM", from);
        console.log(" TO", to);
        // execSync(`fontforge -lang=ff -c 'Open($1);Generate($2)' ${from} ${to}`);
      }

      if (!font.otf) {
        const from = directory + "/" + source;
        const to = directory + "/" + label + ".otf";
        console.log(" FROM", from);
        console.log(" TO", to);

      }
    });
    //
  });
