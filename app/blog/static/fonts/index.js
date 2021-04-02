const fs = require("fs-extra");

const fonts = fs
  .readdirSync(__dirname)
  .filter((i) => {
    return (
      fs.statSync(`${__dirname}/${i}`).isDirectory() &&
      fs.existsSync(`${__dirname}/${i}/package.json`)
    );
  })
  .map((id) => {
    const package = fs.readJsonSync(`${__dirname}/${id}/package.json`);
    const name = package.name;
    const stack = package.stack || name;
    const line_height = package.line_height || 1.4;
    const line_width = package.line_width || 38;
    const font_size = package.font_size || 1;

    let styles = "";

    try {
      styles = fs.readFileSync(`${__dirname}/${id}/style.css`, "utf8");
    } catch (e) {}

    return {
      name,
      id,
      stack,
      line_height,
      line_width,
      font_size,
      styles,
    };
  });

module.exports = fonts;
