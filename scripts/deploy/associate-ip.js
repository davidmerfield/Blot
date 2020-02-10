var AWS = require("aws-sdk");
var accessKeyId = process.env.AWS_DEPLOYMENT_ACCESS_KEY_ID;
var secretAccessKey = process.env.AWS_DEPLOYMENT_SECRET_ACCESS_KEY;

AWS.config.update({
	accessKeyId,
	secretAccessKey
});

var ec2 = new AWS.EC2({ region: process.env.AWS_REGION });

// Configure Route 53 to point a host to this elastic IP
// Create A records
const AllocationId = process.env.AWS_DEPLOYMENT_ELASTIC_IP_ID;
const InstanceId = process.env.AWS_DEPLOYMENT_INSTANCE_ID;

var params = {
	AllocationId,
	InstanceId
};

ec2.associateAddress(params, function(err, data) {
	if (err) console.log(err, err.stack);
	else console.log(data);
});
