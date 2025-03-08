const exec = require("util").promisify(require("child_process").exec);

module.exports = async () => {
  // use brctl quota to get the iCloud Drive quota and usage
  // e.g. '1899909948243 bytes of quota remaining in personal account'
  const { stdout: quota, stderr: quotaErr } = await exec("brctl quota");
  if (quotaErr) {
    console.error(`Error getting iCloud Drive quota: ${quotaErr}`);
    return res.status(500).send(quotaErr);
  }

  return parseInt(quota.match(/(\d+) bytes of quota remaining/)[1]);
};
