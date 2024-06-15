const fs = require("fs-extra");
const hash = require("helper/hash");
const config = require("config");
const { join } = require("path");

module.exports = ({cacheID, viewDirectory}) => () => (text, render) => {
    const path = render(text);
  
    let identifier = cacheID;
  
    try {
      const contents = fs.readFileSync(join(viewDirectory, path), "utf8");
      identifier = hash(contents).slice(0, 8);
      // console.log('hashed', path, identifier);
    } catch (e) {
      console.log('failed to hash', path, e);
      // if the file doesn't exist, we'll use the cacheID
    }
  
    return `${config.cdn.origin}/documentation/v-${identifier}${path}`;
  };