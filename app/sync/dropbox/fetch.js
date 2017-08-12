var Blog = require('blog');
var ERROR = {NOTHING: 'No changes recieved'};

module.exports = function(blogID, options, callback) {

  Blog.makeClient(blogID, function(error, client){

    // Fetch the latest state of this user
    Blog.get({id: blogID}, function(err, blog){


    });
  });
};
