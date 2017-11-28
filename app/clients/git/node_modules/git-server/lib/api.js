var url = require('url');
var path = require('path');
var connect = require('connect');
var bodyParser = connect.bodyParser();

var api = {
	get: {},
	put: {},
	post: {},
	delete: {}
};

module.exports = function(req, res, git, next) {
	req.path = {};
	req.path.url = url.parse(req.url.toLowerCase());
	req.path.parts = req.path.url.pathname.split("/");
	api.router(req, function(err, isApiCall, fn) {
		if(err) {
			throw new Error(err);
		}
		if(!isApiCall) {
			next();
		} else {
			bodyParser(req, res, function() {
				fn(req, res, git, next);
			});
		}
	});
}

api.router = function(req, callback) {
	if(req.path.parts[1] !== 'api') {
		callback(null, false, null);
		return;
	}
	method = req.method.toLowerCase();
	if(!api[method]) {
		callback(null, true, api.method_not_allowed);
		return;
	}
	if(!api[method][req.path.parts[2]]) {
		callback(null, true, api.not_found);
		return;
	}
	callback(null, true, api[method][req.path.parts[2]]);
}

api.method_not_allowed = function(req, res) {
	res.writeHead(405, {'Content-Type': 'text/plain'});
	if(req.errmsg) {
		if(typeof req.errmsg !== 'string') {
			req.errmsg = req.errmsg.toString();
		}
		res.end(req.errmsg);
	} else {
		res.end('Method not allowed');
	}
}
api.not_found = function(req, res) {
	res.writeHead(404, {'Content-Type': 'text/plain'});
	if(req.errmsg) {
		if(typeof req.errmsg !== 'string') {
			req.errmsg = req.errmsg.toString();
		}
		res.end(req.errmsg);
	} else {
		res.end('404, Not found');
	}

}
api.bad_request = function(req, res) {
	res.writeHead(400, {'Content-Type': 'text/plain'});
	if(req.errmsg) {
		if(typeof req.errmsg !== 'string') {
			req.errmsg = req.errmsg.toString();
		}
		res.end(req.errmsg);
	} else {
		res.end('Bad request');
	}
}

api.get.repo = function(req, res, git) {
	repo = git.getRepo(req.path.parts[3]);
	if(repo) {
		tmp = repo;
		delete tmp.git_events
		delete tmp.event 
		delete tmp.onSuccessful
		res.end(JSON.stringify(tmp));
	} else {
		api.not_found(req, res);
	}
}

api.post.repo = function(req, res, git) {
	try {
		req.body.users = JSON.parse(req.body.users);
	} catch(e) {
		req.errmsg = "Invadid JSON in users array";
		api.bad_request(req, res);
		return;
	}
	git.createRepo(req.body, function(err) {
		if(err) {
			req.errmsg = err;
			api.bad_request(req, res);
			return;
		}
		res.end('Repo created');
	});
}

api.delete.repo = function(req, res, git) {

}

api.put.repo = function(req, res, git) {

}

api.get.user = function(req, res, git) {
	var repo = git.getRepo(req.path.parts[3]);
	var user = req.path.parts[4];
	
}

api.post.user = function(req, res, git) {
	
}

api.delete.user = function(req, res, git) {
	
}

api.put.user = function(req, res, git) {
	
}