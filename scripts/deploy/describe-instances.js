var colors = require("colors/safe");

var AWS = require("aws-sdk");
var accessKeyId = process.env.AWS_DEPLOYMENT_ACCESS_KEY_ID;
var secretAccessKey = process.env.AWS_DEPLOYMENT_SECRET_ACCESS_KEY;

AWS.config.update({
	accessKeyId,
	secretAccessKey
});

var ec2 = new AWS.EC2({ region: process.env.AWS_REGION });

var instances = [];

ec2.describeInstances({}, function(err, data) {
	if (err) throw err;

	data.Reservations.forEach(function(res) {
		instances = instances.concat(res.Instances);
	});

	instances.forEach(instance => {
		var state = instance.State.Name;
		state = colors[state === "stopped" ? "red" : "green"](state);

		console.log(
			`${state} ${instance.InstanceId} ${colors.dim(instance.InstanceType)} `
		);
	});
});
