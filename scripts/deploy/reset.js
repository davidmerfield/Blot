const colors = require("colors/safe");
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_DEPLOYMENT_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_DEPLOYMENT_SECRET_ACCESS_KEY,
});

const ec2 = new AWS.EC2({ region: process.env.AWS_REGION });

console.log("Before reset:");
require("./describe-instances")(function () {
  ec2.describeInstances({}, function (err, data) {
    if (err) throw err;

    let instances = [];

    data.Reservations.forEach(function (res) {
      instances = instances.concat(res.Instances);
    });

    const InstanceIds = instances

      // Find instances created by the deploy script
      // (we add these tags in launch-instance.js)
      .filter(({ Tags }) => {
        return Tags.filter(
          (tag) => tag.Key === "deployed" && tag.Value === "true"
        ).length;
      })

      // Find instances that are not terminated
      .filter(({ State: { Name } }) => {
        return Name !== "terminated";
      })

      .map((instance) => instance.InstanceId);

    if (!InstanceIds.length) return;

    ec2.terminateInstances({ InstanceIds }, function (err, data) {
      if (err) throw err;
      // console.log(data);
      console.log("After reset:");
      require("./describe-instances")(function () {
        console.log("Reset instances!");
      });
    });
  });
});
