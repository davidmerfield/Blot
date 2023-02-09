const fs = require("fs-extra");
const { join, dirname, basename, extname } = require("path");

// A function which will try to move a file or directory
// if the destination alread exists, it will add a suffix
// to the destination file name to prevent a conflict.
// e.g. if you 'move' 'a.txt' to a location with another 'a.txt'
// then 'move' will rename it 'a copy.txt'. 
const move = async (base, from, to) => {
  let destination;

  try {
    await fs.move(join(base, from), join(base, to));
    destination = to;
  } catch (e) {
    if (e && e.message === "dest already exists.") {
      return move(base, from, suffixer(to));
    } else {
      console.log("error:", e);
      console.log("from:", from);
      console.log("to:", to);
      throw e;
    }
  }
  return destination;
};

const suffixer = (path) => {
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

  // 'a copy.txt' => 'a copy 2.txt'
  if (base.endsWith(" copy")) {
    return join(dir, `${base} 2${ext}`);

    // 'a copy 2.txt' => 'a copy 3.txt'
  } else if (numberAtEnd && baseWithoutNumber.endsWith(" copy")) {
    return join(dir, `${baseWithoutNumber} ${numberAtEnd + 1}${ext}`);

    // 'a.txt' => 'a copy.txt'
  } else {
    return join(dir, `${base} copy${ext}`);
  }
};

// export for testing purposes
move.suffixer = suffixer;

module.exports = move;
