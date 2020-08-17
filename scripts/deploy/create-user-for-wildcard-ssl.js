const colors = require("colors/safe");
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_DEPLOYMENT_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_DEPLOYMENT_SECRET_ACCESS_KEY,
});

var route53 = new AWS.Route53();
var iam = new AWS.IAM();

const UserName = "blot-deployment-wildcard-ssl-user";

route53.listHostedZones({}, function (err, data) {
  if (err) console.log(err, err.stack);
  // an error occurred
  // else console.log(data); // successful response

  const YOUR_HOSTED_ZONE_ID = data.HostedZones.filter(
    (zone) => zone.Name === process.env.BLOT_HOST + "."
  )[0].Id;

  console.log(YOUR_HOSTED_ZONE_ID);

  var policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["route53:ListHostedZones", "route53:GetChange"],
        Resource: ["*"],
      },
      {
        Effect: "Allow",
        Action: ["route53:ChangeResourceRecordSets"],
        Resource: ["arn:aws:route53:::" + YOUR_HOSTED_ZONE_ID],
      },
    ],
  };

  var params = {
    PolicyDocument: JSON.stringify(policy) /* required */,
    PolicyName: "blot-deployment-wildcard-ssl" /* required */,
    Description: "Will allow the user to create DNS records",
    Path: "/",
  };

  iam.createPolicy(params, function (err, data) {
    if (err) console.log(err, err.stack);
    // an error occurred
    else console.log(data); // successful response

    const PolicyArn = data.Policy.Arn;

    /*
   data = {
    Role: {
     Arn: "arn:aws:iam::123456789012:role/Test-Role", 
     AssumeRolePolicyDocument: "<URL-encoded-JSON>", 
     CreateDate: <Date Representation>, 
     Path: "/", 
     RoleId: "AKIAIOSFODNN7EXAMPLE", 
     RoleName: "Test-Role"
    }
   }
   */
    iam.createUser(
      {
        UserName,
      },
      function (err, data) {
        if (err) console.log(err, err.stack);
        // an error occurred
        else console.log(data); // successful response

        /*
   data = {
    User: {
     Arn: "arn:aws:iam::123456789012:user/Bob", 
     CreateDate: <Date Representation>, 
     Path: "/", 
     UserId: "AKIAIOSFODNN7EXAMPLE", 
     UserName: "Bob"
    }
   }
   */
        /* The following command attaches the AWS managed policy named AdministratorAccess to the IAM user named Alice. */

        iam.attachUserPolicy(
          {
            PolicyArn,
            UserName,
          },
          function (err, data) {
            if (err) console.log(err, err.stack);
            // an error occurred
            else console.log(data); // successful response

            iam.createAccessKey({ UserName }, function (err, data) {
              if (err) console.log(err, err.stack);
              // an error occurred
              else console.log(data); // successful response
              /*
   data = {
    AccessKey: {
     AccessKeyId: "AKIAIOSFODNN7EXAMPLE", 
     CreateDate: <Date Representation>, 
     SecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY", 
     Status: "Active", 
     UserName: "Bob"
    }
   }
   */
            });
          }
        );
      }
    );
  });
});
