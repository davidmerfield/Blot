var eachBlog = require('../each/blog');
var moment = require('moment');
var helper = require('../../app/helper');
var forEach = helper.forEach;
var arrayify = helper.arrayify;
var Entries = require('../../app/models/entries');
var Blog = require('../../app/models/blog');
var Email = require('../../app/email');
var analytics = require('../../app/middleware/analytics');

var diskspace = require('./disk-space');
var memory = require('./memory');

if (require.main === module) {
  main(process.exit);
}

function main (callback) {

  memory(function(usedMem, availableMem){

    diskspace(function(usedDisk, availableDisk){

      var now = Date.now();

      var day = 1000*60*60*24;

      var yesterday = now - day;

      var next_month = now + (day * 30);

      var view = {
        memory: {used: usedMem, available: availableMem},
        disk_space: {used: usedDisk, available: availableDisk},
        total_posts: 0,
        total_new_posts: 0,
        total_subscriptions: 0,
        total_cancellations: 0,
        new_posts: {},
        renewals: {}
      };

      function handleSubscriptions (user,blog,next) {

        if (user.subscription && user.subscription.status &&
           (user.subscription.cancel_at_period_end || user.subscription.status !== 'active')) {
          view.total_cancellations++;
          return next();
        }

        if (user.subscription && user.subscription.status && !user.subscription.cancel_at_period_end) {

          view.total_subscriptions++;

          var next_payment = user.subscription.current_period_end * 1000;

          if (next_payment > now && next_payment < next_month) {

            var blogs = [];

            forEach(user.blogs,function(blogID, nextBlog){

              Blog.get({id: blogID}, function(err, blog){

                blog.link = 'http://' + blog.handle + '.blot.im';

                blogs.push(blog);
                nextBlog();
              });

            }, function(){

              // For the trailing comma in a list
              blogs[blogs.length - 1].last = true;

              view.renewals[user.uid] = {
                name: user.name,
                email: user.email,
                fee: user.subscription.quantity * user.subscription.plan.amount / 100,
                blogs: blogs,
                next_payment: next_payment,
                from_now: moment(next_payment).fromNow(),
                time: moment(next_payment).format("ddd D MMM YYYY [at] h:mm:ss a")
              };

              next();

            });

          } else {
            next();
          }

        } else {
          next();
        }

      }

      eachBlog(function (user, blog, next) {

        if (require.main === module)
          console.log('checking', blog.id, blog.handle);

        handleSubscriptions(user, blog, function(){

          Entries.getTotal(blog.id, function(err, total){

            view.total_posts += total;

            Entries.getRecent(blog.id, function(entries){

              forEach(entries, function(entry, nextEntry){

                if (entry.created > yesterday) {
                  view.total_new_posts++;
                  view.new_posts[blog.id] = view.new_posts[blog.id] || {
                    blog: blog,
                    entries: [],
                    total: total,
                    link: blog.domain ? 'http://' + blog.domain : 'http://' + blog.handle + '.blot.im'
                  };
                  view.new_posts[blog.id].entries.push(entry);
                }

                nextEntry();

              }, next);
            });
          });
        });

      }, function(){

        analytics.yesterday(function(err, views){

          if (err || !views) views = 0;

          views = numberWithCommas(parseInt(views));
          view.views = views;

          view.total_revenue = '$' + numberWithCommas(view.total_subscriptions * 20) + '.00';
          view.new_posts = arrayify(view.new_posts);
          view.renewals = arrayify(view.renewals);

          view.renewals.sort(function(a, b){
            return a.next_payment - b.next_payment;
          });

          view.total_posts = numberWithCommas(view.total_posts);

          Email.DAILY_UPDATE('', view, callback);
        });
      });

    });
  });
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = main;