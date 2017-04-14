var defaultPlugins = require('../../plugins').defaultList;
var defaultTemplate = require('../template').defaultTemplate;

module.exports = {
  title: 'Blog',
  isDisabled: false,
  avatar: '',
  roundAvatar: false,
  cssURL: '',
  scriptURL: '',
  template: defaultTemplate,
  menu: [
    {id: Date.now() + 1 + '', label: 'Home', url: '/'},
    {id: Date.now() + 2 + '', label: 'Archives', url: '/archives'},
    {id: Date.now() + 3 + '', label: 'Search', url: '/search'},
    {id: Date.now() + 4 + '', label: 'Feed', url: '/feed.rss'}
  ],
  domain: '',
  pageSize: 5,
  permalink: {format: '{{slug}}', custom: '', isCustom: false},
  timeZone: 'UTC',
  dateFormat: 'M/D/YYYY',
  dateDisplay: 'MMMM D, YYYY',
  hideDates: false,
  plugins: defaultPlugins,
  cacheID: 0
};