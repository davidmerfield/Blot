var analytics = require('../../app/analytics');

analytics.today(function(err, views){

  console.log(views, 'views today');

  // analytics.rotate(function(err, views){

  //   console.log('Reset?');

  //   analytics.today(function(err, views){

  //     console.log(views);
  //     console.log('done');

  //   })
  // })
});