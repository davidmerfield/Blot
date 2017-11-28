var pushover = require('pushover');
var http = require('http');
var https = require('https');
var async = require('async');
var fs = require('fs');
var crypto = require('crypto');
var git_events = require('git-emit');
var path = require('path');
var EventEmitter = require('events').EventEmitter
var proxy = require('event-proxy');
var api = require('./api');

GitServer = (function() {
  function GitServer(repos, logging, repoLocation, port, certs, enable_http_api) {
    var _this = this;
    this.repos = repos;
    this.logging = logging;
    this.repoLocation = repoLocation;
    this.port = port;
    this.certs = certs;
    this.api = enable_http_api;
    this.getRepo = function(repoName) {
      return GitServer.prototype.getRepo.apply(_this, arguments);
    };
    this.getUser = function(username, password, repo) {
      return GitServer.prototype.getUser.apply(_this, arguments);
    };
    this.checkTriggers = function(method, repo) {
      return GitServer.prototype.checkTriggers.apply(_this, arguments);
    };
    this.onPush = function(push) {
      return GitServer.prototype.onPush.apply(_this, arguments);
    };
    this.onFetch = function(fetch) {
      return GitServer.prototype.onFetch.apply(_this, arguments);
    };
    this.makeReposIfNull = function(callback) {
      return GitServer.prototype.makeReposIfNull.apply(_this, arguments);
    };
    this.gitListeners = function() {
      return GitServer.prototype.gitListeners.apply(_this, arguments);
    };
    this.permissableMethod = function(username, password, method, repo, gitObject) {
      return GitServer.prototype.permissableMethod.apply(_this, arguments);
    };
    this.processSecurity = function(gitObject, method, repo) {
      return GitServer.prototype.processSecurity.apply(_this, arguments);
    };
    this.log = function() {
      return GitServer.prototype.log.apply(_this, arguments);
    };
    this.createRepo = function(repo, callback) {
      return GitServer.prototype.createRepo.apply(_this, arguments);
    };
    this.git = pushover(this.repoLocation, {
      autoCreate: false
    });
    this.permMap = {
      fetch: 'R',
      push: 'W'
    };
    this.gitListeners();
    this.makeReposIfNull(function() {
      _this.bindEvents(function() {
        var message, red, reset;
        if (_this.certs != null) {
          if(_this.api) {
            _this.server = https.createServer(_this.certs);
          } else {
            _this.server = https.createServer(_this.certs, _this.git.handle.bind(_this.git));
          }
        } else {
          red = '\033[31m';
          reset = '\033[0m';
          message = "WARNING: No SSL certs passed in. Running as HTTP and not HTTPS.\nBe careful, without HTTPS your user/pass will not be encrypted";
          console.log(red + message + reset);
          if(_this.api) {
            _this.server = http.createServer();
          } else {
            _this.server = http.createServer(_this.git.handle.bind(_this.git));
          }
        }
        if(_this.api) {
          _this.registerApiServer(function() {
            _this.server.listen(_this.port, function() {
              _this.log('Server listening on ', _this.port, '\r');
            });
          });
        } else {
          return _this.server.listen(_this.port, function() {
            return _this.log('Server listening on ', _this.port, '\r');
          });
        }
      });
});
}

GitServer.prototype.registerApiServer = function(callback) {
  var self = this;
  this.server.on('request', function(req, res) {
    api(req, res, self, function() {
      self.git.handle(req, res);
    });
  });
  callback();
}

GitServer.prototype.bindEvents = function(callback) {
  var self = this;
  for (var i in this.repos) {
    this.repos[i].path = path.normalize(this.repoLocation+"/"+this.repos[i].name+".git");
    this.repos[i].git_events = git_events(this.repos[i].path);
    this.repos[i].last_commit = {};
    this.repos[i].event = function(repo, update) {
      emitters = self.listeners(update.name).length;
      self.log("Emitting "+update.name+" event.");
      if(emitters < 1 && update.canAbort) {
        self.log("No event listeners on "+update.name+". Accepting....");
        update.accept();
      } else {
        self.emit(update.name, update, repo);
      }
    }
    var map = {
      "post-applypatch": this.repos[i].event,
      "post-commit": this.repos[i].event,
      "post-checkout": this.repos[i].event,
      "post-merge": this.repos[i].event,
      "post-receive": this.repos[i].event,
      "post-update": this.repos[i].event,
      "post-rewrite": this.repos[i].event,
      "applypatch-msg": this.repos[i].event,
      "pre-applypatch": this.repos[i].event,
      "pre-commit": this.repos[i].event,
      "prepare-commit-msg": this.repos[i].event,
      "commit-msg": this.repos[i].event,
      "pre-rebase": this.repos[i].event,
      "pre-receive": this.repos[i].event,
      "update": this.repos[i].event,
      "pre-auto-gc": this.repos[i].event
    }
    proxy(process, map, this.repos[i].git_events, this.repos[i]);
  }
  callback();
}

GitServer.prototype.createRepo = function(repo, callback) {
  if ((repo.name == null) || (repo.anonRead == null)) {
    callback(new Error('Not enough details, need atleast .name and .anonRead'), null)
    this.log('Not enough details, need atleast .name and .anonRead');
    return false;
  }
  if (!this.getRepo(repo.name)) {
    this.log('Creating repo', repo.name);
    this.repos.push(repo);
    return this.git.create(repo.name, callback);
  } else {
    callback(new Error('This repo already exists'), null)
    return this.log('This repo already exists');
  }
};

GitServer.prototype.log = function() {
  var args, key, value;
  args = (function() {
    var _results;
    _results = [];
    for (key in arguments) {
      value = arguments[key];
      _results.push("" + value);
    }
    return _results;
  }).apply(this, arguments);
  if (this.logging) {
    return console.log("LOG: ", args.join(' '));
  }
};

GitServer.prototype.processSecurity = function(gitObject, method, repo) {
  var auth, creds, plain_auth, req, res;
  req = gitObject.request;
  res = gitObject.response;
  auth = req.headers['authorization'];
  if (auth === void 0) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.end('<html><body>Need some creds son</body></html>');
  } else {
    plain_auth = (new Buffer(auth.split(' ')[1], 'base64')).toString();
    creds = plain_auth.split(':');
    return this.permissableMethod(creds[0], creds[1], method, repo, gitObject);
  }
};

GitServer.prototype.permissableMethod = function(username, password, method, repo, gitObject) {
  var user, _ref;
  this.log(username, 'is trying to', method, 'on repo:', repo.name, '...');
  user = this.getUser(username, password, repo);
  if (user === false) {
    this.log(username, 'was rejected as this user doesnt exist, or password is wrong');
    return gitObject.reject(500, 'Wrong username or password');
  } else {
    if (_ref = this.permMap[method], user.permissions.indexOf(_ref) >= 0) {
      this.log(username, 'Successfully did a', method, 'on', repo.name);
      return this.checkTriggers(method, repo, gitObject);
    } else {
      this.log(username, 'was rejected, no permission to', method, 'on', repo.name);
      return gitObject.reject(500, "You dont have these permissions");
    }
  }
};

GitServer.prototype.gitListeners = function() {
  this.git.on('push', this.onPush);
  this.git.on('fetch', this.onFetch);
  return this.git.on('info', this.onFetch);
};

GitServer.prototype.makeReposIfNull = function(callback) {
  var repo, repoNames, _i, _len, _ref,
  _this = this;
  this.log('Making repos if they dont exist');
  repoNames = [];
  _ref = this.repos;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    repo = _ref[_i];
    if ((repo.name != null) && (repo.anonRead != null) && (repo.users != null)) {
      repoNames.push("" + repo.name + ".git");
    } else {
      console.log('Bad Repo', repo.name, 'is missing an attribute..');
    }
  }
  return async.reject(repoNames, this.git.exists.bind(this.git), function(error, results) {
    var _j, _len1;
    if (!error && results.length > 0) {
      for (_j = 0, _len1 = results.length; _j < _len1; _j++) {
        repo = results[_j];
        console.log('Creating repo directory: ', repo);
      }
      return async.map(results, _this.git.create.bind(_this.git), callback);
    } else {
      return callback();
    }
  });
};

GitServer.prototype.onFetch = function(fetch) {
  var repo;
  this.log('Got a FETCH call for', fetch.repo);
  repo = this.getRepo(fetch.repo);
  if (repo !== false) {
    if (repo.anonRead === true) {
      return this.checkTriggers('fetch', repo, fetch);
      this.checkTriggers('fetch', repo, fetch);
      return fetch.accept();
    } else {
      return this.processSecurity(fetch, 'fetch', repo);
    }
  } else {
    this.log('Rejected - Repo', fetch.repo, 'doesnt exist');
    return fetch.reject(500, 'This repo doesnt exist');
  }
};

GitServer.prototype.onPush = function(push) {
  var repo;
  this.log('Got a PUSH call for', push.repo);
  repo = this.getRepo(push.repo);
  var data = {
    status: push.status,
    repo: push.repo,
    service: push.service,
    cwd: push.cwd,
    last: push.last,
    commit: push.commit,
    evName: push.evName,
    branch: push.branch
  }
  repo.last_commit = data;
  if (repo !== false) {
    return this.processSecurity(push, 'push', repo);
  } else {
    this.log('Rejected - Repo', push.repo, 'doesnt exist');
    return push.reject(500, 'This repo doesnt exist');
  }
};

GitServer.prototype.checkTriggers = function(method, repo, gitObject) {
  var _base;
  gitObject.name = method;
  gitObject.canAbort = true;
  repo.event(repo, gitObject);
};

GitServer.prototype.getUser = function(username, password, repo) {
  var userObject, _i, _len, _ref;
  crypted_password = crypto.createHash('sha1').update(password).digest('hex');
  _ref = repo.users;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    userObject = _ref[_i];
    if (userObject.user.username === username && (userObject.user.password === password || crypted_password === userObject.user.password)) {
      return userObject;
    }
  }
  return false;
};

GitServer.prototype.getRepo = function(repoName) {
  var repo, _i, _len, _ref;
  _ref = this.repos;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    repo = _ref[_i];
    if (repo.name + '.git' === repoName || repoName === repo.name) {
      return repo;
    }
  }
  return false;
};

GitServer.prototype.__proto__ = EventEmitter.prototype;

return GitServer;
})();

module.exports = GitServer;
