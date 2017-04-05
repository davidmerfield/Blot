module.exports = function(server){

  var auth = require('authHandler');
  var moment = require('moment'); require('moment-timezone');


  server.use('/settings', auth.enforce);

  require('./404s')(server);
  require('./apps')(server);
  require('./blog')(server);
  require('./design')(server);
  require('./redirects')(server);
  require('./status')(server);
  require('./verify')(server);


  server.get('/settings', function(req, res){

    var blog = req.blog;

    for (var i in res.locals.blog.menu) {
      res.locals.blog.menu[i].index = i;
    }

    var formats = [
      'D/M/YYYY',
      'M/D/YYYY',
      'YYYY/M/D'
    ];

    var alias = {
      'D/M/YYYY': 'Day-Month-Year',
      'M/D/YYYY': 'Month-Day-Year',
      'YYYY/M/D': 'Year-Month-Day'
    };

    var displays = [
      'D/M/Y',
      'M/D/Y',
      'Y/M/D',
      'MMMM D, Y',
      'MMMM D, Y [at] h:mma',
      'Y-MM-DD',
      'Y-MM-DD hh:mm'
    ];

    var timeZones = fetchZones();
    var displayFormats = [];
    var dateFormats = [];

    for (var x in timeZones)
      if (timeZones[x].value === blog.timeZone)
        timeZones[x].selected = 'selected';

    formats.forEach(function(format){

      dateFormats.push({
        value: format,
        selected: format === blog.dateFormat ? 'selected' : '',
        date: alias[format]
      });
    });

    displays.forEach(function(display){

      var now = moment.utc(Date.now())
            .tz(blog.timeZone)
            .format(display);

      displayFormats.push({
        value: display,
        selected: display === blog.dateDisplay ? 'selected' : '',
        date: now
      });
    });

    res.addLocals({
      title: 'Blot - Settings',
      name: 'Settings',
      timeZones: timeZones,
      partials: {yield: 'dashboard/settings/general', sub_nav: 'dashboard/settings/_nav'},
      tab: {settings: 'selected', profile: 'selected'},
      displayFormats: displayFormats,
      dateFormats: dateFormats
    });

    res.render('dashboard/_wrapper');
  });

  function fetchZones () {

    var when = Date.now();

    var zones = moment.tz.names().filter(function(s){

      if (s === 'UTC') return true;

      if (s === 'Pacific/Auckland') return true;

      if (s === 'Pacific/Marquesas') return false;
      if (s === 'America/Caracas') return false;
      if (s === 'Asia/Kabul') return false;
      if (s === 'Asia/Pyongyang') return false;
      if (s === 'Australia/Eucla') return false;
      if (s === 'Pacific/Chatham') return false;
      if (s === 'US/Pacific-New') return false;
      if (s === 'Asia/Tehran') return false;
      if (s === 'Asia/Katmandu' || s === 'Asia/Kathmandu') return false;
      if (s === 'Etc/GMT-14' || s === 'Pacific/Apia' || s === 'Pacific/Kiritimati') return false;

      if (s.indexOf('Etc/') === 0) return false;
      if (s.indexOf('Pacific/') === 0) return false;
      if (s.indexOf('Antarctica') !== -1) return false;

      return /\//.test(s);
    });

    var times = [];

    for (var i in zones) {

      var time = moment.utc(when)
            .tz(zones[i])
            .format('h:mm a, MMMM Do');

      var zone = moment.tz.zone(zones[i]);
      var offset = zone.offset(when);

      times.push({
        time: time,
        value: zones[i],
        offset: offset
      });

    }

    times.sort(function(a, b){

      if (b.offset - a.offset !== 0)
        return b.offset - a.offset;

      var nameA=a.value.toLowerCase(),
          nameB=b.value.toLowerCase();

       if (nameA < nameB) //sort string ascending
        return -1;
       if (nameA > nameB)
        return 1;
       return 0;
    });

    return times;
  }
};
