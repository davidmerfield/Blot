// https://developers.google.com/drive/api/v3/quickstart/nodejs

const	express = require('express');
const dashboard = new express.Router();

const {google} = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GD_CLIENT_ID,
  process.env.GD_CLIENT_SECRET,
  'http://localhost:8822/clients/googledrive/authenticate'
);

dashboard.get('/', function(req, res){
	res.redirect('/setup');
});

dashboard.get('/setup', function(req, res){
	res.render('setup');
});

dashboard.get('/redirect', function(req,  res){
		const url = oauth2Client.generateAuthUrl({
	  // 'online' (default) or 'offline' (gets refresh_token)
	  access_type: 'offline',

	  // If you only need one scope you can pass it as a string
	  scope: "https://www.googleapis.com/auth/drive.metadata.readonly"
	});
		res.redirect(url);
});

dashboard.get('/authenticate', function(req, res){
	// This will provide an object with the access_token and refresh_token.
	// Save these somewhere safe so they can be used at a later time.
	oauth2Client.getToken(req.query.code).then(function(res){
			
		// we need to persist part of this response
		// use it to generate new tokens in future
		console.log(res);

		oauth2Client.setCredentials(res.tokens);

		listFiles(oauth2Client);
		res.send('Success!');
	}).catch(function(err){
		console.log(err);
	});
});

function listFiles(auth) {
  const drive = google.drive({ version: "v3", auth });
  drive.files.list(
    {
      pageSize: 10,
      fields: "nextPageToken, files(id, name)"
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const files = res.data.files;
      if (files.length) {
        console.log("Files:");
        files.map(file => {
          console.log(`${file.name} (${file.id})`);
        });
      } else {
        console.log("No files found.");
      }
    }
  );
}

module.exports = dashboard;