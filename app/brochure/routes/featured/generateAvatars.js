var sharp = require("sharp");

fs.readdir(__dirname + "/avatars", function(err, avatars) {
  if (err) return callback(err);

  avatars.forEach(function(avatar){
    host = avatar.slice(0, avatar.lastIndexOf('.'));
    if (host) 
  });