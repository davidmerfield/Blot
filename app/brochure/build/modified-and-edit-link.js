const moment = require("moment");
const { execSync } = require("child_process");
const { join } = require("path");

module.exports = (dir, path) => {
  // console.log("dir", dir);
  // console.log("path", path);

  if (
    path.indexOf("how/") !== 0 &&
    path.indexOf("about/") !== 0 &&
    path.indexOf("templates/") !== 0
  ) {
    return "";
  }

  let modifiedDate = execSync(
    `git log -1 --pretty="format:%ci" ${join(dir, path)}`
  ).toString();
  let relativeDate = moment(modifiedDate).fromNow();

  // console.log("modifiedDate", modifiedDate);
  // console.log("relativeDate", relativeDate);

  const result = `<p class="meta-links">
    <a href="https://github.com/davidmerfield/Blot/commits/master/app/brochure/views/${path}">
      Last updated ${relativeDate}
    </a>
    <a href="https://github.com/davidmerfield/Blot/tree/master/app/brochure/views/${path}">
    Edit this page
    </a> 
    </p>
    `;
  // console.log("result", result);

  return result;
};
