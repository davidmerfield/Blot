{{{appJS}}}

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

document.getElementById('open-nav').onclick = function (e){
  body.addClass('nav-is-open');
  e.preventDefault();
  return false;
};

document.getElementById('close-nav').onclick = function (e){
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

/*! instant.page v1.2.2 - (C) 2019 Alexandre Dieulot - https://instant.page/license */
let urlToPreload;
let mouseoverTimer;
let lastTouchTimestamp;

const prefetcher = document.createElement("link");
const isSupported =
  prefetcher.relList &&
  prefetcher.relList.supports &&
  prefetcher.relList.supports("prefetch");
const isDataSaverEnabled =
  navigator.connection && navigator.connection.saveData;
const allowQueryString = "instantAllowQueryString" in document.body.dataset;
const allowExternalLinks = "instantAllowExternalLinks" in document.body.dataset;

if (isSupported && !isDataSaverEnabled) {
  prefetcher.rel = "prefetch";
  document.head.appendChild(prefetcher);

  const eventListenersOptions = {
    capture: true,
    passive: true
  };
  document.addEventListener(
    "touchstart",
    touchstartListener,
    eventListenersOptions
  );
  document.addEventListener(
    "mouseover",
    mouseoverListener,
    eventListenersOptions
  );
}

function touchstartListener (event) {
  /* Chrome on Android calls mouseover before touchcancel so `lastTouchTimestamp`
   * must be assigned on touchstart to be measured on mouseover. */
  lastTouchTimestamp = performance.now();

  const linkElement = event.target.closest("a");

  if (!isPreloadable(linkElement)) {
    return;
  }

  linkElement.addEventListener("touchcancel", touchendAndTouchcancelListener, {
    passive: true
  });
  linkElement.addEventListener("touchend", touchendAndTouchcancelListener, {
    passive: true
  });

  urlToPreload = linkElement.href;
  preload(linkElement.href);
}

function touchendAndTouchcancelListener () {
  urlToPreload = undefined;
  stopPreloading();
}

function mouseoverListener (event) {
  if (performance.now() - lastTouchTimestamp < 1100) {
    return;
  }

  const linkElement = event.target.closest("a");

  if (!isPreloadable(linkElement)) {
    return;
  }

  linkElement.addEventListener("mouseout", mouseoutListener, { passive: true });

  urlToPreload = linkElement.href;

  mouseoverTimer = setTimeout(() => {
    preload(linkElement.href);
    mouseoverTimer = undefined;
  }, 65);
}

function mouseoutListener (event) {
  if (
    event.relatedTarget &&
    event.target.closest("a") == event.relatedTarget.closest("a")
  ) {
    return;
  }

  if (mouseoverTimer) {
    clearTimeout(mouseoverTimer);
    mouseoverTimer = undefined;
  } else {
    urlToPreload = undefined;
    stopPreloading();
  }
}

function isPreloadable (linkElement) {
  if (!linkElement || !linkElement.href) {
    return;
  }

  if (urlToPreload == linkElement.href) {
    return;
  }

  const preloadLocation = new URL(linkElement.href);

  if (
    !allowExternalLinks &&
    preloadLocation.origin != location.origin &&
    !("instant" in linkElement.dataset)
  ) {
    return;
  }

  if (!["http:", "https:"].includes(preloadLocation.protocol)) {
    return;
  }

  if (preloadLocation.protocol == "http:" && location.protocol == "https:") {
    return;
  }

  if (
    !allowQueryString &&
    preloadLocation.search &&
    !("instant" in linkElement.dataset)
  ) {
    return;
  }

  if (
    preloadLocation.hash &&
    preloadLocation.pathname + preloadLocation.search ==
      location.pathname + location.search
  ) {
    return;
  }

  if ("noInstant" in linkElement.dataset) {
    return;
  }

  return true;
}

function preload (url) {
  prefetcher.href = url;
}

function stopPreloading () {
  prefetcher.removeAttribute("href");
}

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

{{#relative_dates}}

var dates = document.querySelectorAll('[date-from-now]');
  
dates.forEach(function(el){
  var dateStamp = parseInt(el.getAttribute('date-from-now'));
  if (isNaN(dateStamp))
    return console.log('No date parsed');
  
  // if the date is older than a year, don't bother
  if (Date.now() - dateStamp > 1000*60*60*24*30*12)
  	return console.log('Date too old');
  
    var new_str = relativeDate(new Date(dateStamp));
  el.innerHTML = new_str;
});

{{/relative_dates}}

$(function() {
  init();
});
  
function init () {

  // Smooth scroll
  var scroll = new SmoothScroll('a[href*="#"]');

  var images = $('.entry img').filter(function(el){
      
    if ($(this).parents('a').length) {
      return false;
    }

    if ($(this).attr('width') && $(this).attr('width') > 380) {
      return true;
    }

    return false;
  }).toArray();

  // // Medium zoom
  // mediumZoom(images);
}

                                      