var eachBlog = require('../each/blog');
var Entries = require('../../app/models/entries');
var moment = require('moment');

var totalBlogs = 0;
var activeBlogs = 0;
var disabledBlogs = 0;
var MAU = 0;

var subscribers = 0;
var cancelledSubscribers = 0;
var freeloaders = 0;

var totalEntries = 0;

var TAX_RATE = 0.4;
var goal = 1000000;

var monthlyCosts = {AWS: 110.00};
var annualCosts = {domain: 29.00};
var leaderboard = [];

eachBlog(function (user, blog, next) {

  // console.log();
  // console.log(blog.handle);
  // console.log(blog.dateFormat);

  if (user.subscription) {

    if (user.subscription.cancel_at_period_end) {
      console.log(blog.handle, 'will quit at the end of the billing period.');
      cancelledSubscribers++;
    } else if (user.subscription.status && user.subscription.status !== 'active') {
      console.log(blog.handle, 'has an inactive subscription');
      cancelledSubscribers++;
    } else if (user.subscription.status === 'active') {

      // user.blogs.length

      subscribers ++;

    } else {
      freeloaders++;
    }
  }

  totalBlogs++;

  if (blog.isDisabled || user.isDisabled) {
    disabledBlogs++;
    return next();
  } else {
    activeBlogs++;
  }

  // if (blog.domain) {
  //   console.log(blog.domain);
  // } else {
  //   console.log(blog.handle + '.blot.im');
  // }

  Entries.getTotal(blog.id, function(err, entries){
    totalEntries += entries;
    leaderboard.push({handle: blog.handle, total: entries});

    Entries.lastUpdate(blog.id, function(err, stamp){

      var lastMonth = Date.now() - 1000*60*60*24*30;

      if (moment.utc(stamp).valueOf() > lastMonth) {
        MAU++;
      }

      next();
    });
  });

}, function(){

  leaderboard = leaderboard.sort(function(a, b){
    return b.total - a.total;
  });

  var none = 0;
  var barely = 0;
  var ok = 0;
  var great = 0;
  var awesome = 0;

  for (var i in leaderboard) {

    var total = leaderboard[i].total;

    console.log(leaderboard[i].handle, total);

    if (total === 1) none++;
    if (total <= 5) barely++;
    if (total <= 10) ok++;
    if (total > 50) great++;
    if (total > 100) awesome++;

  }

  console.log('________________________');
  console.log(Math.round(none/totalBlogs * 100) + '% of blogs have not published anything');
  console.log(Math.round(barely/totalBlogs * 100) + '% of blogs have published 5 or less');
  console.log(Math.round(ok/totalBlogs * 100) + '% of blogs have published 10 or less');

  console.log('________________________');
  console.log(Math.round(great/totalBlogs * 100) + '% of blogs have published more than 50');
  console.log(Math.round(awesome/totalBlogs * 100) + '% of blogs have published more than 100');

  console.log('________________________');
  console.log('TOTAL: ' + totalBlogs);
  console.log('ACTIVE: ' + activeBlogs);
  console.log('MONTHLY ACTIVE: ' + MAU);
  console.log('DISABLED: ' + disabledBlogs);

  console.log('subscribers: ' + subscribers);
  console.log('cancelled: ' + cancelledSubscribers);
  console.log('freeloaders: ' + freeloaders);

  var costs = 0;

  for (var i in annualCosts)
    costs += annualCosts[i];

  for (var x in monthlyCosts)
    costs += (monthlyCosts[x] * 12);

  var income = (subscribers * (20 - 0.88)).toFixed(2);
  var monthlyIncome = (income/12).toFixed(2);

  console.log('Total entries published:     ' + totalEntries);
  console.log('________________________');
  console.log('Revenue:     $' + income + ' / y');
  console.log('             $' + monthlyIncome + ' / m');


  console.log('________________________');
  console.log('Costs:     $' + costs.toFixed(2) + ' / y');
  console.log('             $' + (costs/12).toFixed(2) + ' / m');

  var EBITDA = (income - costs).toFixed(2);

  console.log('________________________');
  console.log('Income:     $' + EBITDA + ' / y');
  console.log('             $' + (EBITDA/12).toFixed(2) + ' / m');

  var profit = ((income - costs)* (1 - TAX_RATE)).toFixed(2);

  console.log('________________________');
  console.log('Profit:      $' + profit + ' / y');
  console.log('              $' + (profit/12).toFixed(2) + ' / m');
  console.log('________________________');
  console.log('Goal:              ' + (profit/goal * 100).toFixed(2) + '%');


});