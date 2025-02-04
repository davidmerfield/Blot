const colors = require("colors/safe");
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_DEPLOYMENT_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_DEPLOYMENT_SECRET_ACCESS_KEY,
});

if (require.main === module) {
  main(function () {
    process.exit();
  });
}

function main(callback) {
  const ec2 = new AWS.EC2({ region: process.env.AWS_REGION });

  ec2.describeInstances({}, function (err, data) {
    if (err) throw err;

    let instances = [];

    data.Reservations.forEach(function (res) {
      instances = instances.concat(res.Instances);
    });

    instances.sort(function compare(a, b) {
      if (a.State.Name < b.State.Name) {
        return -1;
      }
      if (a.State.Name > b.State.Name) {
        return 1;
      }
      return 0;
    });

    instances.forEach((instance) => {
      var state = instance.State.Name;
      state = colors[
        state === "stopped" || state === "terminated" ? "red" : "green"
      ](state);

      console.log(
        `${state} ${instance.InstanceId} ${colors.dim(instance.InstanceType)} `
      );
    });
    callback();
  });
}

module.exports = main;
