const moment = require("moment");
const { execSync } = require("child_process");
const { join } = require("path");

module.exports = (dir, path) => {
  // console.log("dir", dir);
  // console.log("path", path);

  let modifiedDate = execSync(
    `git log -1 --pretty="format:%ci" ${join(dir, path)}`
  ).toString();
  let relativeDate = moment(modifiedDate).fromNow();

  // console.log("modifiedDate", modifiedDate);
  // console.log("relativeDate", relativeDate);

  const result = `<p class="meta-links"><small>
    Last updated ${relativeDate} 
    <a href="https://github.com/davidmerfield/Blot/tree/master/app/brochure/views/${path}">Edit this page</a> 
    <a href="https://github.com/davidmerfield/Blot/commits/master/app/brochure/views/${path}">View the history of this page</a>
    </small></p>
    `;
  // console.log("result", result);

  return result;
};
