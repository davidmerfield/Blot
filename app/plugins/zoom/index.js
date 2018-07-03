// Don't zoom images smaller than this
var MIN_WIDTH = 320;

function render ($, callback) {

  $('img').each(function(){

    try {

      // Ignore img inside links
      if ($(this).parents('a').length) return;

      var width;

      width = $(this).attr('width') || $(this).attr('data-width');
      width = parseFloat(width);

      // Don't zoom images if they're tiny
      if (width && width > MIN_WIDTH)
        $(this).attr('data-action', 'zoom');

    } catch (e) {}

  });

  callback();
}

module.exports = {
  render: render,
  isDefault: false,
  category: 'images',
  title: 'Zoomer',
  description: 'Adds a zoom to large images'
};