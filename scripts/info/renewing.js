var eachBlog = require('../each/blog');
var moment = require('moment');

var payments = {

};

var users = {};

eachBlog(function (user, blog, next) {

  console.log();

  if (users[user.uid]) {
    return next();
  }

  // Because we are doing each
  // blog we want to avoid counting folks multiple times
  users[user.uid] = true;

  if (!user.subscription || !user.subscription.current_period_end) {
    console.log('>>>> skipping blog with no subscription', blog.handle);
    return next();
  }

  if (user.subscription.cancel_at_period_end) {
    console.log('xxxxx blog', blog.handle, 'will cancel :( status:', user.subscription.status);
    return next();
  }

  if (user.isDisabled || blog.isDisabled) {
    throw 'Shit, this user is disabled but has an active subscription';
  }

  var total = user.subscription.quantity * user.subscription.plan.amount / 100;

  // console.log(user.subscription);
  console.log('$$$$ ',blog.handle);
  console.log('PRICE: $', total);

  var nextPayment = moment(user.subscription.current_period_end * 1000);

  var month = nextPayment.format('MMMM');
  var year = nextPayment.format('YYYY');
  var day = nextPayment.format('D');

  // Prepare the object
  payments[year] = payments[year] || {};
  payments[year][month] = payments[year][month] || {};
  payments[year][month][day] = payments[year][month][day] || 0;

  // Increase the price
  payments[year][month][day] += total;

  return next();

}, function(){

  display('April');
  display('May');
  display('June');
  display('July');
  display('August');
  display('September');
  display('October');
  display('November');
  display('December');

  // console.log(payments['2016'].April);
  // console.log('May');
  // console.log(payments['2016'].May);

  console.log('done');
});

function display (monthName) {

  console.log();
  console.log();
  console.log('-----------------');
  console.log(monthName + ':');
  console.log('-----------------');

  var monthlyTotal = 0;

  for (var day in payments['2016'][monthName]) {
    console.log(' ', day + ':', ' $' + payments['2016'][monthName][day]);
    monthlyTotal += payments['2016'][monthName][day];
  }

  console.log('-----------------');
  console.log('           $' + monthlyTotal);

}