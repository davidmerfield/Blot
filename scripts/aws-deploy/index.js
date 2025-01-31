var AWS = require("aws-sdk");
var accessKeyId = process.env.AWS_DEPLOYMENT_ACCESS_KEY_ID;
var secretAccessKey = process.env.AWS_DEPLOYMENT_SECRET_ACCESS_KEY;

AWS.config.update({
  accessKeyId,
  secretAccessKey,
});

var ec2 = new AWS.EC2({ region: process.env.AWS_REGION });

var ImageId = process.env.AWS_IMAGE_ID;
var InstanceType = process.env.AWS_INSTANCE_TYPE;

const SecurityGroupIds = [process.env.AWS_SECURITY_GROUP_ID];
const KeyName = process.env.AWS_KEY_NAME;
const SubnetId = process.env.AWS_SUBNET_ID;

// Generate latest version of user-data script
require("./build");

const UserData = require("fs").readFileSync(
  __dirname + "/out/user-data.sh",
  "base64"
);

// We don't need to define the ephemeral disks in this mapping, per the docs:
// NVMe instance store volumes are automatically enumerated and assigned a device name.
// Including them in your block device mapping has no effect.
const BlockDeviceMappings = [
  {
    // I believe this device name makes this
    // EBS volume the root volume for the server
    DeviceName: "/dev/xvda",
    Ebs: {
      VolumeType: "gp2",
      VolumeSize: 123,
      DeleteOnTermination: true,
      Encrypted: true,
    },
  },
  /* more items */
];

const TagSpecifications = [
  {
    ResourceType: "instance",
    Tags: [
      {
        Key: "deployed",
        Value: "true",
      },
      {
        Key: "Name",
        Value: "new-Blot",
      },
    ],
  },
];

/*
   data = {
    AvailabilityZone: "us-east-1a", 
    CreateTime: <Date Representation>, 
    Encrypted: false, 
    Iops: 240, 
    Size: 80, 
    SnapshotId: "", 
    State: "creating", 
    VolumeId: "vol-6b60b7c7", 
    VolumeType: "gp2"
   }
   */

let params = {
  ImageId,
  BlockDeviceMappings,
  InstanceType,
  KeyName,
  MaxCount: 1,
  MinCount: 1,
  SecurityGroupIds,
  SubnetId,
  UserData,
  TagSpecifications,
};

ec2.runInstances(params, function (err, data) {
  if (err) console.log(err, err.stack);
  // an error occurred
  // else console.log(data); // successful response
  const InstanceId = data.Instances[0].InstanceId;
  console.log("Waiting until instance is running", InstanceId);
  ec2.waitFor("instanceRunning", { InstanceIds: [InstanceId] }, function (
    err,
    data
  ) {
    if (err) console.log(err, err.stack);
    // an error occurred
    // else console.log(data); // successful response
    // const instance = data.Reservations[0].Instances[0];

    // ec2.createVolume()

    if (data) console.log("Instance running");
    // console
    // 	.log();

    // `ssh -o 'StrictHostKeyChecking no' -i blot-deployment.pem ec2-user@${instance.PublicIpAddress} -t 'tail -f /var/log/cloud-init-output.log'`

    require("./associate-ip");
  });
});
