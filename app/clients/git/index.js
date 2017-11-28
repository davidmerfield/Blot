var GitServer = require('git-server');

var newUser = {
  username:'demo',
  password:'demo'
};

var newRepo = {
  name:'myrepo',
  anonRead:false,
  users: [
    { user:newUser, permissions:['R','W'] }
  ]
};

server = new GitServer({repos: [ newRepo ], httpApi: true});

var express = require('express');

var app = express();

app.use(server);
app.listen(8989);