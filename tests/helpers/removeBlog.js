var Blog = require('../../app/models/blog');

module.exports = function(done){
  
  var id = global.blog.id;

  
  Blog.remove(id, function(err){

    if (err) {
      return done(err);
    }

    delete global.blog;

    done();
  });
};