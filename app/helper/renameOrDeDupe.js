const fs = require("fs-extra");
const { join, dirname, basename, extname } = require("path");

const renameOrDeDupe = async (base, from, to) => {
  let destination;

  try {
    await fs.move(join(base, from), join(base, to));
    destination = to;
  } catch (e) {
    if (e && e.message === "dest already exists.") {
      return renameOrDeDupe(base, from, dedupe(to));
    } else {
      console.log("error:", e);
      console.log("from:", from);
      console.log("to:", to);
      throw e;
    }
  }
  return destination;
};

const dedupe = (path) => {
  const dir = dirname(path);
  const ext = extname(path);
  const base = basename(path, ext);

  let numberAtEnd;
  let baseWithoutNumber;

  try {
    numberAtEnd = parseInt(base.split(" ").pop());
    if (isNaN(numberAtEnd)) {
      numberAtEnd = null;
    } else {
      baseWithoutNumber = base.split(" ").slice(0, -1).join(" ");
    }
  } catch (e) {}

  if (base.endsWith(" copy")) {
    return join(dir, base + " 2" + ext);
  } else if (numberAtEnd) {
    return join(
      dir,
      baseWithoutNumber + " " + (numberAtEnd + 1).toString() + ext
    );
  } else {
    return join(dir, base + " copy" + ext);
  }
};

module.exports = renameOrDeDupe;
