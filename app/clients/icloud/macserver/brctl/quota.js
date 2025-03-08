const exec = require("../exec");

module.exports = async () => {
  // use brctl quota to get the iCloud Drive quota and usage
  // e.g. '1899909948243 bytes of quota remaining in personal account'
  const { stdout, stderr } = await exec("brctl", ["quota"]);
  
  if (stderr) {
    console.error(`Error getting iCloud Drive quota: ${stderr}`);
    return res.status(500).send(stderr);
  }

  return parseInt(stdout.match(/(\d+) bytes of quota remaining/)[1]);
};
