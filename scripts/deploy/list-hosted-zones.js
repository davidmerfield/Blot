const colors = require("colors/safe");
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_DEPLOYMENT_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_DEPLOYMENT_SECRET_ACCESS_KEY,
});

var route53 = new AWS.Route53();

route53.listHostedZones({}, function (err, data) {
  if (err) console.log(err, err.stack);
  // an error occurred
  else console.log(data); // successful response
  const YOUR_HOSTED_ZONE_ID = data.HostedZones.filter(
    (zone) => zone.Name === process.env.BLOT_HOST + "."
  )[0].Id;
});
