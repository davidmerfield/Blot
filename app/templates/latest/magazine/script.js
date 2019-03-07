{{{appJS}}}

var open = document.getElementById('open-nav');
var close = document.getElementById('close-nav');
var body = document.body;

Element.prototype.addClass = function (classToAdd) {
  var classes = this.className.split(' ')
  if (classes.indexOf(classToAdd) === -1) classes.push(classToAdd)
  this.className = classes.join(' ')
}

Element.prototype.removeClass = function (classToRemove) {
  var classes = this.className.split(' ')
  var idx =classes.indexOf(classToRemove)
  if (idx !== -1) classes.splice(idx,1)
  this.className = classes.join(' ')
}

open.onclick = function (e){
  body.addClass('nav-is-open');
  e.preventDefault();
  return false;
};

close.onclick = function (e){
  body.removeClass('nav-is-open');
  e.preventDefault();
  return false;
};


var scrollpos = window.scrollY;
var top_button = document.getElementById('top_button');

function add_class_on_scroll(el){ el.classList.add("show")}
function remove_class_on_scroll (el){ el.classList.remove("show")}

window.addEventListener('scroll', function() { 
  scrollpos = window.scrollY;
  if (scrollpos >= 100) { add_class_on_scroll(top_button) }
  else { remove_class_on_scroll(top_button) }
});


var transition = Barba.BaseTransition.extend({
  
  start: function() {
    this.newContainerLoading.then(this.finish.bind(this));
  },

  finish: function() {
    window.scrollTo(0,0);
    this.done();
  }
});

Barba.Pjax.getTransition = function() {
  return transition;
};


Barba.Pjax.originalPreventCheck = Barba.Pjax.preventCheck;

Barba.Pjax.preventCheck = function(evt, element) {
  
  if (!Barba.Pjax.originalPreventCheck(evt, element)) {
    return false;
  }

  // No need to check for element.href -
  // originalPreventCheck does this for us! (and more!)
  if (/./.test(element.href.toLowerCase())) {
    return false;
  }

  return true;
};

Barba.Prefetch.init();
Barba.Pjax.start();

Barba.Dispatcher.on('newPageReady', function(currentStatus, oldStatus, container) {
	
  init();

});


var relativeDate = (function(undefined){

  var SECOND = 1000,
      MINUTE = 60 * SECOND,
      HOUR = 60 * MINUTE,
      DAY = 24 * HOUR,
      WEEK = 7 * DAY,
      YEAR = DAY * 365,
      MONTH = YEAR / 12;

  var formats = [
    [ 0.7 * MINUTE, 'just now' ],
    [ 1.5 * MINUTE, 'a minute ago' ],
    [ 60 * MINUTE, 'minutes ago', MINUTE ],
    [ 1.5 * HOUR, 'an hour ago' ],
    [ DAY, 'hours ago', HOUR ],
    [ 2 * DAY, 'yesterday' ],
    [ 7 * DAY, 'days ago', DAY ],
    [ 1.5 * WEEK, 'a week ago'],
    [ MONTH, 'weeks ago', WEEK ],
    [ 1.5 * MONTH, 'a month ago' ],
    [ YEAR, 'months ago', MONTH ],
    [ 1.5 * YEAR, 'a year ago' ],
    [ Number.MAX_VALUE, 'years ago', YEAR ]
  ];

  function relativeDate(input,reference){
    !reference && ( reference = (new Date).getTime() );
    reference instanceof Date && ( reference = reference.getTime() );
    input instanceof Date && ( input = input.getTime() );
    
    var delta = reference - input,
        format, i, len;

    for(i = -1, len=formats.length; ++i < len; ){
      format = formats[i];
      if(delta < format[0]){
        return format[2] == undefined ? format[1] : Math.round(delta/format[2]) + ' ' + format[1];
      }
    };
  }

  return relativeDate;

})();

var dates = document.querySelectorAll('[date-from-now]');
  
dates.forEach(function(el){
  var dateStamp = parseInt(el.getAttribute('date-from-now'));
  console.log(dateStamp);
  if (isNaN(dateStamp))
    return console.log('No date parsed');
  if (Date.now() - dateStamp > 1000*60*60*24*30*3)
  	return console.log('Date too old');
  var new_str = relativeDate(new Date(dateStamp));
	console.log(new_str);
  el.innerHTML = new_str;
});

$(function() {
  init();
});
  
console.log('HERE');

function init () {

console.log('HERE TOO');

  // Smooth scroll
  var scroll = new SmoothScroll('a[href*="#"]');

  var images = $('.entry img').filter(function(el){
      
    console.log($(this).parents('a').length);

    if ($(this).parents('a').length) {
      return false;
    }

    if ($(this).attr('width') && $(this).attr('width') > 380) {
      return true;
    }

    return false;
  }).toArray();

  console.log('Images', images);

  // Medium zoom
  mediumZoom(images);
}

                                      