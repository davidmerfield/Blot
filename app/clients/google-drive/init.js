const config = require("config");
const { refreshAllServiceAccounts } = require("./serviceAccount/refresh");

const TEN_MINUTES = 1000 * 60 * 10; // 10 minutes in milliseconds

module.exports = () => {
  const serviceAccounts = config.google_drive.service_accounts;

  refreshAllServiceAccounts(serviceAccounts);
  setInterval(() => refreshAllServiceAccounts(serviceAccounts), TEN_MINUTES);
};