var config = require("../../config");
var AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: config.aws.key,
  secretAccessKey: config.aws.secret
});

console.log('key', config.aws.key);
console.log('secret', config.aws.secret);

AWS.config.update({
  region: "us-west-2"
});

var ec2 = new AWS.EC2();

ec2.describeVolumes({}, function(err, data) {
  if (err) console.log(err, err.stack);
  // an error occurred
  else console.log(data.Volumes[0]); // successful response
});

ec2.modifyVolume(
  {
    VolumeId: "STRING_VALUE",
    DryRun: true,
    Size: 1000
  },
  function(err, data) {
    if (err) console.log(err, err.stack);
    // an error occurred
    else console.log(data); // successful response
  }
);
