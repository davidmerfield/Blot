const { bunny } = require("config");
const fetch = require("node-fetch");

module.exports = async function (req, res, next) {

  // If the user has not enabled the CDN, we don't need to do anything
  if (!req.updates.flags || !req.updates.flags.cdn) {
    return next();
  }

  // If the server does not have the CDN credentials, we don't need to do anything
  if (!config.bunny || !config.bunny.pullzone_id || !config.bunny.secret) {
    return next();
  }

  console.log('flags=', req.updates.flags);
  console.log("we have the CDN flags!");

  console.log('the domain is', req.blog.domain);

//   const response = await fetch(
//     `https://api.bunny.net/pullzone/${config.bunny.pullzone_id}/addHostname`,
//     {
//       method: "POST",
//       headers: {
//         "content-type": "application/json",
//         "AccessKey": config.bunny.secret,
//       },
//       body: JSON.stringify({ Hostname: req.blog.domain }),
//     }
//   );
//   const json = await res.json();

//   const url = `https://api.bunny.net/pullzone/${config.bunny.pullzoneID}/loadFreeCertificate?hostname=${req.blog.domain}`;
//   const options = {
//     method: "GET",
//     headers: { accept: "application/json", AccessKey: "123" },
//   };

//   const resTwo = await fetch(url, options);
//   const jsonTwo = await res.json();

  next();
};
