const fs = require("fs-extra");

const renameOrDeDupe = async (from, to) => {
  try {
    await fs.rename(from, to);
  } catch (e) {
    if (e && e.code === "ENOTEMPTY") {
    } else {
    }
  }
};

module.exports = renameOrDeDupe;
