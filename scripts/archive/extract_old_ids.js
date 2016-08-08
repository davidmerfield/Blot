var dump = __dirname + '/dump.ssv';
var redis = require('redis').createClient();
var fs = require('fs');
var eachBlog = require('./each/blog');
var options = require('minimist')(process.argv.slice(2));

fs.writeFileSync(dump, '', 'utf-8');

eachBlog(function(user, blog, nextBlog){

  console.log('BLOG:', blog.id);

  redis.keys('blog:' + blog.id + ':entry:*', function(err, entryKeys){

    if (err) throw err;

    redis.mget(entryKeys, function(err, entries){

      if (err) throw err;

      entries = entries.map(JSON.parse);

      entries.forEach(function(entry){

        if (entry.path.indexOf('\n') > -1) {
          console.log('--> SKIPPING', entry.path);
          return;
        }

        var line = blog.id + ' ' + entry.id + ' ' + entry.path + '\n';

        fs.appendFileSync(dump, line, 'utf-8');
      });

      nextBlog();
    });
  });
}, process.exit, options);
