var Blog = require('../../app/models/blog');

module.exports = function(done){
  
  var id = global.blog.id;

  console.log(global.blog.handle, 'DELETING BLOG');
  
  Blog.remove(id, function(err){

    if (err) {
      console.log(global.blog.handle, 'ERROR DELETING BLOG', err);
      return done(err);
    }

    console.log(global.blog.handle, 'DELETED BLOG');
    delete global.blog;

    done();
  });
};