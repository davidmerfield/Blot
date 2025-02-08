const fetch = require("node-fetch");

const check = async host => {
  try {
    console.log("Checking if " + host + " is online...");
    
    const res = await fetch("https://" + host + "/verify/domain-setup", {
      timeout: 10000 // 10 seconds
    });

    const body = await res.text();

    if (!body || body.indexOf(" ") > -1 || body.length > 100)
      throw new Error("Host " + host + " is not online");

    return true;
  } catch (e) {
    return false;
  }
};

// export a function which calls check three times in case of failure and if all fail then it returns false
module.exports = async host => {
  for (let i = 0; i < 3; i++) {
    const isOnline = await check(host);
    if (isOnline) return true;
  }

  return false;
};
