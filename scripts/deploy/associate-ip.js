var AWS = require("aws-sdk");
var accessKeyId = process.env.AWS_DEPLOYMENT_ACCESS_KEY_ID;
var secretAccessKey = process.env.AWS_DEPLOYMENT_SECRET_ACCESS_KEY;

AWS.config.update({
  accessKeyId,
  secretAccessKey,
});

var ec2 = new AWS.EC2({ region: process.env.AWS_REGION });

// Configure Route 53 to point a host to this elastic IP
// Create A records
const AllocationId = process.env.AWS_DEPLOYMENT_ELASTIC_IP_ID;

ec2.describeInstances({}, function (err, data) {
  if (err) throw err;

  let instances = [];

  data.Reservations.forEach(function (res) {
    instances = instances.concat(res.Instances);
  });

  const InstanceId = instances

    // Find instances created by the deploy script
    // (we add these tags in launch-instance.js)
    .filter(({ Tags }) => {
      return Tags.filter(
        (tag) => tag.Key === "deployed" && tag.Value === "true"
      ).length;
    })

    // Find instances that are not terminated
    .filter(({ State: { Name } }) => {
      return Name === "running";
    })

    .pop().InstanceId;

  var params = {
    AllocationId,
    InstanceId,
    AllowReassociation: true,
  };

  ec2.associateAddress(params, function (err, data) {
    if (err) console.log(err, err.stack);
    else console.log(data);

    ec2.describeAddresses({ AllocationIds: [AllocationId] }, function (
      err,
      data
    ) {
      if (err) console.log(err, err.stack); // an error occurred
      // console.log(data);
      console.log("Associated public IP to new instance");
      console.log(
        `ssh -o 'StrictHostKeyChecking no' -i blot-deployment.pem ec2-user@${data.Addresses[0].PublicIp} -t 'tail -f /var/log/cloud-init-output.log'`
      );
    });
  });
});
