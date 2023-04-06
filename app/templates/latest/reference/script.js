// Plugin JavaScript for analytics embed code
{{{appJS}}}


/*

Close button on entry page
--------------------------

Purpose of this script is to allow the close button on the
entry page to behave like the browser back button. It works
out how far back in your navigation history you'd need to
go to. It sort of simulates a popover 'Close' button, if the
entry were a modal window in a slideshow. You can go to the
next or previous entry but then still return to the last index
page. Why bother doing this? When you press back, your browser
will return you to the old scroll offset with great speed.

*/

var articles = [{{#all_entries}}'{{{url}}}'{{^last}},{{/last}}{{/all_entries}}];
var backIndex;

determineBackIndex();

function determineBackIndex () {
  var localHistory = sessionStorage.getItem("localHistory");

  if (localHistory) {
    try {
      localHistory = JSON.parse(localHistory);
    } catch (e) {
      localHistory = [];
    }
  } else {
    localHistory = [];
  }

  localHistory = localHistory.slice(-50);
  localHistory.push(window.location);
  sessionStorage.setItem("localHistory", JSON.stringify(localHistory));

  // we go back in the list of visited pages until we find
  // an item which doesn't match a known entry's URL
  localHistory.reverse().forEach(function(href, i) {
    if (backIndex === undefined && articles.indexOf(decodeURIComponent(href.pathname)) === -1) {
      backIndex = i;
      return false;
    }
  });
}
// Safari does not re-run scripts when the page is navigated
// to using browser history, so we need to detect this event
// and re-calculate the index page in the history location.
window.addEventListener( "pageshow", function ( event ) {
  var historyTraversal = event.persisted || 
                         ( typeof window.performance != "undefined" && 
                              window.performance.navigation.type === 2 );
  if ( historyTraversal ) {
    determineBackIndex();
  }
});

function lastIndexPage() {
  // reset the list of pages visited
  sessionStorage.setItem("localHistory", JSON.stringify([]));
  if (backIndex !== undefined && -backIndex < 0 && window.history.length > backIndex) {
    window.history.go(-backIndex);    
  } else {
    window.location = '/';
  }
  return false;
}

function randomArticle() {
  window.location = articles[Math.floor(Math.random() * articles.length)];
  return false;
}


var searchInput = document.querySelectorAll('[name="q"]')[0];
var results = document.getElementById("results");
var searchForm = document.getElementById("searchForm");
var dropdown = document.getElementById("dropdown");
var linkToSearch = document.getElementById("link-to-search");

var index = null;

function moveFocusUp() {
  if (index === null) {
    index = 0;
  } else {
    index--;
  }

  setFocus();
}

function moveFocusDown() {
  if (index === null) {
    index = 0;
  } else {
    index++;
  }

  setFocus();
}

function setFocus() {
  var focussedLinks = document.querySelectorAll("#dropdown a");

  if (index > focussedLinks.length) {
    index = focussedLinks.length;
  }

  if (index < 0) {
    index = 0;
  }

  focussedLinks[index].focus();
}

// My take on jquery's $(node).parents(secondnode);
function parents(node, secondnode) {
  while (node.parentNode) {
    if (node.parentNode === secondnode) return true;
    node = node.parentNode;
  }
  return false;
}

var nextLink = document.querySelector('[data-next]');
var previousLink = document.querySelector('[data-previous]');
var nextURL = nextLink && nextLink.getAttribute('href');
var previousURL = previousLink && previousLink.getAttribute('href');

document.onkeydown = function(e) {

  if (previousURL && e.keyCode == '39') {
    return window.location = previousURL;
  }

   if (nextURL && e.keyCode == '37') {
    return window.location = nextURL;
  }

  if (!parents(document.activeElement, searchForm)) return;

  if (e.keyCode === 37 && document.activeElement !== searchInput) {
    searchInput.focus();
    e.preventDefault();
    return false;
  }

  if (e.keyCode !== 40 && e.keyCode !== 38) return;

  if (e.keyCode === 40) {
    moveFocusDown();
  } else if (e.keyCode === 38) {
    moveFocusUp();
  }

  e.preventDefault();
  return false;
};

function close() {
  dropdown.style.display = "none";
  index = null;
}

if (searchInput) {
searchInput.oninput = loadResults;
searchInput.onclick = loadResults;
}

function loadResults() {
  dropdown.addEventListener("mousedown", function(e) {
    e.stopPropagation();
  });

  document.body.addEventListener("mousedown", close);

  var query = searchInput.value;

  if (!query) {
    dropdown.style.display = "none";
    return;
  }

  dropdown.style.display = "block";

  linkToSearch.innerHTML = searchInput.value;
  linkToSearch.parentNode.href =
    "/search?q=" + encodeURIComponent(searchInput.value);

  httpGetAsync("/search?q=" + query + "&debug=true", function(res) {
    if (searchInput.value !== query) return;

    res = JSON.parse(res);

    // limit number of results to 15
    res.entries = res.entries.slice(0, 15);

    var result, html;
    html = "";
    res.entries.forEach(function(entry) {
      result = "";

      result += '<a class="result" href="' + entry.url + '">';

      result += '<span class="thumbnail">';

      if (entry.thumbnail && entry.thumbnail.square)
        result += '<img src="' + entry.thumbnail.square.url + '">';

      result += "</span>";

      result +=
        '<span class="title">' +
        entry.title.split(query).join("<b>" + query + "</b>") +
        '</span>';

      if (entry.date)
        result += '<span class="date"> - ' +
        entry.date +
        "</span>";

      result += "</a>";

      html += result;
    });
    results.innerHTML = html;
  });
}

function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  };
  xmlHttp.open("GET", theUrl, true); // true for asynchronous
  xmlHttp.send(null);
}


/*

Tag list
--------

Opens and closes the long list of tags
on the template's index page.

*/

var tagToggle = document.getElementById("opentags");

if (tagToggle)
  tagToggle.onclick = function(e) {
    if (document.getElementById("tags").className.indexOf("open") > -1) {
      document.getElementById("tags").className = document
        .getElementById("tags")
        .className.replace("open", "");
    } else {
      document.getElementById("tags").className += " open";
    }
    e.preventDefault();
    return false;
  };





/*

Relative dates
--------------

This function maps entry dates to relative values
e.g. December 11th 2018 -> 2 minutes ago

*/

var relativeDate = (function(undefined) {
  var SECOND = 1000,
    MINUTE = 60 * SECOND,
    HOUR = 60 * MINUTE,
    DAY = 24 * HOUR,
    WEEK = 7 * DAY,
    YEAR = DAY * 365,
    MONTH = YEAR / 12;

  var formats = [
    [0.7 * MINUTE, "just now"],
    [1.5 * MINUTE, "a minute ago"],
    [60 * MINUTE, "minutes ago", MINUTE],
    [1.5 * HOUR, "an hour ago"],
    [DAY, "hours ago", HOUR],
    [2 * DAY, "yesterday"],
    [7 * DAY, "days ago", DAY],
    [1.5 * WEEK, "a week ago"],
    [MONTH, "weeks ago", WEEK],
    [1.5 * MONTH, "a month ago"],
    [YEAR, "months ago", MONTH],
    [1.5 * YEAR, "a year ago"],
    [Number.MAX_VALUE, "years ago", YEAR]
  ];

  function relativeDate(input, reference) {
    !reference && (reference = new Date().getTime());
    reference instanceof Date && (reference = reference.getTime());
    input instanceof Date && (input = input.getTime());

    var delta = reference - input,
      format,
      i,
      len;

    for (i = -1, len = formats.length; ++i < len; ) {
      format = formats[i];
      if (delta < format[0]) {
        return format[2] === undefined
          ? format[1]
          : Math.round(delta / format[2]) + " " + format[1];
      }
    }
  }

  return relativeDate;
})();

var dates = document.querySelectorAll("[date-from-now]");

dates.forEach(function(el) {
  var dateStamp = parseInt(el.getAttribute("date-from-now"));
  if (isNaN(dateStamp)) return; // No date parsed
  if (Date.now() - dateStamp > 1000 * 60 * 60 * 24 * 30 * 3) return; // Date too old
  var new_str = relativeDate(new Date(dateStamp));
  el.innerHTML = new_str;
});


/*

Pagination
----------

Generates a list of links like this:

[1] [2] [3] [4] [5]

With optional settings to limit the number of numbers.
Centers around the current link where possible.
Would be nice to do this on the server, too.

*/

document.querySelectorAll(".paginator .numbers").forEach(function(el) {
  var current = parseInt(el.getAttribute("data-current"));
  var total = parseInt(el.getAttribute("data-total"));
  var start = 1;
  var limit;

  if (el.getAttribute("data-limit")) {
    start = current - Math.floor(parseInt(el.getAttribute("data-limit")) / 2);
    if (start < 1) start = 1;
    limit = start + parseInt(el.getAttribute("data-limit")) - 1;
  } else {
    limit = total;
  }

  if (limit > total) limit = total;

  for (var i = start; i <= limit; i++)
    el.innerHTML +=
      '<a href="/page/' +
      i +
      '" class="' +
      (i === current) +
      '" id="number-template">' +
      i +
      "</a> ";
});


{{#infinite_scroll}}

{{=[[ ]]=}}

/*!
 * Infinite Scroll PACKAGED v4.0.1
 * Automatically add next page
 *
 * Licensed GPLv3 for open source use
 * or Infinite Scroll Commercial License for commercial use
 *
 * https://infinite-scroll.com
 * Copyright 2018-2020 Metafizzy
 */
!function(t,e){"object"==typeof module&&module.exports?module.exports=e(t,require("jquery")):t.jQueryBridget=e(t,t.jQuery)}(window,(function(t,e){let i=t.console,n=void 0===i?function(){}:function(t){i.error(t)};return function(i,o,s){(s=s||e||t.jQuery)&&(o.prototype.option||(o.prototype.option=function(t){t&&(this.options=Object.assign(this.options||{},t))}),s.fn[i]=function(t,...e){return"string"==typeof t?function(t,e,o){let r,l=`$().${i}("${e}")`;return t.each((function(t,h){let a=s.data(h,i);if(!a)return void n(`${i} not initialized. Cannot call method ${l}`);let c=a[e];if(!c||"_"==e.charAt(0))return void n(`${l} is not a valid method`);let u=c.apply(a,o);r=void 0===r?u:r})),void 0!==r?r:t}(this,t,e):(r=t,this.each((function(t,e){let n=s.data(e,i);n?(n.option(r),n._init()):(n=new o(e,r),s.data(e,i,n))})),this);var r})}})),function(t,e){"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,(function(){function t(){}let e=t.prototype;return e.on=function(t,e){if(!t||!e)return this;let i=this._events=this._events||{},n=i[t]=i[t]||[];return n.includes(e)||n.push(e),this},e.once=function(t,e){if(!t||!e)return this;this.on(t,e);let i=this._onceEvents=this._onceEvents||{};return(i[t]=i[t]||{})[e]=!0,this},e.off=function(t,e){let i=this._events&&this._events[t];if(!i||!i.length)return this;let n=i.indexOf(e);return-1!=n&&i.splice(n,1),this},e.emitEvent=function(t,e){let i=this._events&&this._events[t];if(!i||!i.length)return this;i=i.slice(0),e=e||[];let n=this._onceEvents&&this._onceEvents[t];for(let o of i){n&&n[o]&&(this.off(t,o),delete n[o]),o.apply(this,e)}return this},e.allOff=function(){return delete this._events,delete this._onceEvents,this},t})),function(t,e){"object"==typeof module&&module.exports?module.exports=e(t):t.fizzyUIUtils=e(t)}(this,(function(t){let e={extend:function(t,e){return Object.assign(t,e)},modulo:function(t,e){return(t%e+e)%e},makeArray:function(t){if(Array.isArray(t))return t;if(null==t)return[];return"object"==typeof t&&"number"==typeof t.length?[...t]:[t]},removeFrom:function(t,e){let i=t.indexOf(e);-1!=i&&t.splice(i,1)},getParent:function(t,e){for(;t.parentNode&&t!=document.body;)if((t=t.parentNode).matches(e))return t},getQueryElement:function(t){return"string"==typeof t?document.querySelector(t):t},handleEvent:function(t){let e="on"+t.type;this[e]&&this[e](t)},filterFindElements:function(t,i){return(t=e.makeArray(t)).filter((t=>t instanceof HTMLElement)).reduce(((t,e)=>{if(!i)return t.push(e),t;e.matches(i)&&t.push(e);let n=e.querySelectorAll(i);return t=t.concat(...n)}),[])},debounceMethod:function(t,e,i){i=i||100;let n=t.prototype[e],o=e+"Timeout";t.prototype[e]=function(){clearTimeout(this[o]);let t=arguments;this[o]=setTimeout((()=>{n.apply(this,t),delete this[o]}),i)}},docReady:function(t){let e=document.readyState;"complete"==e||"interactive"==e?setTimeout(t):document.addEventListener("DOMContentLoaded",t)},toDashed:function(t){return t.replace(/(.)([A-Z])/g,(function(t,e,i){return e+"-"+i})).toLowerCase()}},i=t.console;return e.htmlInit=function(n,o){e.docReady((function(){let s="data-"+e.toDashed(o),r=document.querySelectorAll(`[${s}]`),l=t.jQuery;[...r].forEach((t=>{let e,r=t.getAttribute(s);try{e=r&&JSON.parse(r)}catch(e){return void(i&&i.error(`Error parsing ${s} on ${t.className}: ${e}`))}let h=new n(t,e);l&&l.data(t,o,h)}))}))},e})),function(t,e){"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter"),require("fizzy-ui-utils")):t.InfiniteScroll=e(t,t.EvEmitter,t.fizzyUIUtils)}(window,(function(t,e,i){let n=t.jQuery,o={};function s(t,e){let r=i.getQueryElement(t);if(r){if((t=r).infiniteScrollGUID){let i=o[t.infiniteScrollGUID];return i.option(e),i}this.element=t,this.options={...s.defaults},this.option(e),n&&(this.$element=n(this.element)),this.create()}else console.error("Bad element for InfiniteScroll: "+(r||t))}s.defaults={},s.create={},s.destroy={};let r=s.prototype;Object.assign(r,e.prototype);let l=0;r.create=function(){let t=this.guid=++l;if(this.element.infiniteScrollGUID=t,o[t]=this,this.pageIndex=1,this.loadCount=0,this.updateGetPath(),this.getPath&&this.getPath()){this.updateGetAbsolutePath(),this.log("initialized",[this.element.className]),this.callOnInit();for(let t in s.create)s.create[t].call(this)}else console.error("Disabling InfiniteScroll")},r.option=function(t){Object.assign(this.options,t)},r.callOnInit=function(){let t=this.options.onInit;t&&t.call(this,this)},r.dispatchEvent=function(t,e,i){this.log(t,i);let o=e?[e].concat(i):i;if(this.emitEvent(t,o),!n||!this.$element)return;let s=t+=".infiniteScroll";if(e){let i=n.Event(e);i.type=t,s=i}this.$element.trigger(s,i)};let h={initialized:t=>`on ${t}`,request:t=>`URL: ${t}`,load:(t,e)=>`${t.title||""}. URL: ${e}`,error:(t,e)=>`${t}. URL: ${e}`,append:(t,e,i)=>`${i.length} items. URL: ${e}`,last:(t,e)=>`URL: ${e}`,history:(t,e)=>`URL: ${e}`,pageIndex:function(t,e){return`current page determined to be: ${t} from ${e}`}};r.log=function(t,e){if(!this.options.debug)return;let i=`[InfiniteScroll] ${t}`,n=h[t];n&&(i+=". "+n.apply(this,e)),console.log(i)},r.updateMeasurements=function(){this.windowHeight=t.innerHeight;let e=this.element.getBoundingClientRect();this.top=e.top+t.scrollY},r.updateScroller=function(){let e=this.options.elementScroll;if(e){if(this.scroller=!0===e?this.element:i.getQueryElement(e),!this.scroller)throw new Error(`Unable to find elementScroll: ${e}`)}else this.scroller=t},r.updateGetPath=function(){let t=this.options.path;if(!t)return void console.error(`InfiniteScroll path option required. Set as: ${t}`);let e=typeof t;"function"!=e?"string"==e&&t.match("{{#}}")?this.updateGetPathTemplate(t):this.updateGetPathSelector(t):this.getPath=t},r.updateGetPathTemplate=function(t){this.getPath=()=>{let e=this.pageIndex+1;return t.replace("{{#}}",e)};let e=t.replace(/(\\\?|\?)/,"\\?").replace("{{#}}","(\\d\\d?\\d?)"),i=new RegExp(e),n=location.href.match(i);n&&(this.pageIndex=parseInt(n[1],10),this.log("pageIndex",[this.pageIndex,"template string"]))};let a=[/^(.*?\/?page\/?)(\d\d?\d?)(.*?$)/,/^(.*?\/?\?page=)(\d\d?\d?)(.*?$)/,/(.*?)(\d\d?\d?)(?!.*\d)(.*?$)/],c=s.getPathParts=function(t){if(t)for(let e of a){let i=t.match(e);if(i){let[,t,e,n]=i;return{begin:t,index:e,end:n}}}};r.updateGetPathSelector=function(t){let e=document.querySelector(t);if(!e)return void console.error(`Bad InfiniteScroll path option. Next link not found: ${t}`);let i=e.getAttribute("href"),n=c(i);if(!n)return void console.error(`InfiniteScroll unable to parse next link href: ${i}`);let{begin:o,index:s,end:r}=n;this.isPathSelector=!0,this.getPath=()=>o+(this.pageIndex+1)+r,this.pageIndex=parseInt(s,10)-1,this.log("pageIndex",[this.pageIndex,"next link"])},r.updateGetAbsolutePath=function(){let t=this.getPath();if(t.match(/^http/)||t.match(/^\//))return void(this.getAbsolutePath=this.getPath);let{pathname:e}=location,i=t.match(/^\?/),n=e.substring(0,e.lastIndexOf("/")),o=i?e:n+"/";this.getAbsolutePath=()=>o+this.getPath()},s.create.hideNav=function(){let t=i.getQueryElement(this.options.hideNav);t&&(t.style.display="none",this.nav=t)},s.destroy.hideNav=function(){this.nav&&(this.nav.style.display="")},r.destroy=function(){this.allOff();for(let t in s.destroy)s.destroy[t].call(this);delete this.element.infiniteScrollGUID,delete o[this.guid],n&&this.$element&&n.removeData(this.element,"infiniteScroll")},s.throttle=function(t,e){let i,n;return e=e||200,function(){let o=+new Date,s=arguments,r=()=>{i=o,t.apply(this,s)};i&&o<i+e?(clearTimeout(n),n=setTimeout(r,e)):r()}},s.data=function(t){let e=(t=i.getQueryElement(t))&&t.infiniteScrollGUID;return e&&o[e]},s.setJQuery=function(t){n=t},i.htmlInit(s,"infinite-scroll"),r._init=function(){};let{jQueryBridget:u}=t;return n&&u&&u("infiniteScroll",s,n),s})),function(t,e){"object"==typeof module&&module.exports?module.exports=e(t,require("./core")):e(t,t.InfiniteScroll)}(window,(function(t,e){let i=e.prototype;Object.assign(e.defaults,{loadOnScroll:!0,checkLastPage:!0,responseBody:"text",domParseResponse:!0}),e.create.pageLoad=function(){this.canLoad=!0,this.on("scrollThreshold",this.onScrollThresholdLoad),this.on("load",this.checkLastPage),this.options.outlayer&&this.on("append",this.onAppendOutlayer)},i.onScrollThresholdLoad=function(){this.options.loadOnScroll&&this.loadNextPage()};let n=new DOMParser;function o(t){let e=document.createDocumentFragment();return t&&e.append(...t),e}return i.loadNextPage=function(){if(this.isLoading||!this.canLoad)return;let{responseBody:t,domParseResponse:e,fetchOptions:i}=this.options,o=this.getAbsolutePath();this.isLoading=!0,"function"==typeof i&&(i=i());let s=fetch(o,i).then((i=>{if(!i.ok){let t=new Error(i.statusText);return this.onPageError(t,o,i),{response:i}}return i[t]().then((s=>("text"==t&&e&&(s=n.parseFromString(s,"text/html")),204==i.status?(this.lastPageReached(s,o),{body:s,response:i}):this.onPageLoad(s,o,i))))})).catch((t=>{this.onPageError(t,o)}));return this.dispatchEvent("request",null,[o,s]),s},i.onPageLoad=function(t,e,i){return this.options.append||(this.isLoading=!1),this.pageIndex++,this.loadCount++,this.dispatchEvent("load",null,[t,e,i]),this.appendNextPage(t,e,i)},i.appendNextPage=function(t,e,i){let{append:n,responseBody:s,domParseResponse:r}=this.options;if(!("text"==s&&r)||!n)return{body:t,response:i};let l=t.querySelectorAll(n),h={body:t,response:i,items:l};if(!l||!l.length)return this.lastPageReached(t,e),h;let a=o(l),c=()=>(this.appendItems(l,a),this.isLoading=!1,this.dispatchEvent("append",null,[t,e,l,i]),h);return this.options.outlayer?this.appendOutlayerItems(a,c):c()},i.appendItems=function(t,e){t&&t.length&&(function(t){let e=t.querySelectorAll("script");for(let t of e){let e=document.createElement("script"),i=t.attributes;for(let t of i)e.setAttribute(t.name,t.value);e.innerHTML=t.innerHTML,t.parentNode.replaceChild(e,t)}}(e=e||o(t)),this.element.appendChild(e))},i.appendOutlayerItems=function(i,n){let o=e.imagesLoaded||t.imagesLoaded;return o?new Promise((function(t){o(i,(function(){let e=n();t(e)}))})):(console.error("[InfiniteScroll] imagesLoaded required for outlayer option"),void(this.isLoading=!1))},i.onAppendOutlayer=function(t,e,i){this.options.outlayer.appended(i)},i.checkLastPage=function(t,e){let i,{checkLastPage:n,path:o}=this.options;if(n){if("function"==typeof o){if(!this.getPath())return void this.lastPageReached(t,e)}"string"==typeof n?i=n:this.isPathSelector&&(i=o),i&&t.querySelector&&(t.querySelector(i)||this.lastPageReached(t,e))}},i.lastPageReached=function(t,e){this.canLoad=!1,this.dispatchEvent("last",null,[t,e])},i.onPageError=function(t,e,i){return this.isLoading=!1,this.canLoad=!1,this.dispatchEvent("error",null,[t,e,i]),t},e.create.prefill=function(){if(!this.options.prefill)return;let t=this.options.append;t?(this.updateMeasurements(),this.updateScroller(),this.isPrefilling=!0,this.on("append",this.prefill),this.once("error",this.stopPrefill),this.once("last",this.stopPrefill),this.prefill()):console.error(`append option required for prefill. Set as :${t}`)},i.prefill=function(){let t=this.getPrefillDistance();this.isPrefilling=t>=0,this.isPrefilling?(this.log("prefill"),this.loadNextPage()):this.stopPrefill()},i.getPrefillDistance=function(){return this.options.elementScroll?this.scroller.clientHeight-this.scroller.scrollHeight:this.windowHeight-this.element.clientHeight},i.stopPrefill=function(){this.log("stopPrefill"),this.off("append",this.prefill)},e})),function(t,e){"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,(function(t,e,i){let n=e.prototype;return Object.assign(e.defaults,{scrollThreshold:400}),e.create.scrollWatch=function(){this.pageScrollHandler=this.onPageScroll.bind(this),this.resizeHandler=this.onResize.bind(this);let t=this.options.scrollThreshold;(t||0===t)&&this.enableScrollWatch()},e.destroy.scrollWatch=function(){this.disableScrollWatch()},n.enableScrollWatch=function(){this.isScrollWatching||(this.isScrollWatching=!0,this.updateMeasurements(),this.updateScroller(),this.on("last",this.disableScrollWatch),this.bindScrollWatchEvents(!0))},n.disableScrollWatch=function(){this.isScrollWatching&&(this.bindScrollWatchEvents(!1),delete this.isScrollWatching)},n.bindScrollWatchEvents=function(e){let i=e?"addEventListener":"removeEventListener";this.scroller[i]("scroll",this.pageScrollHandler),t[i]("resize",this.resizeHandler)},n.onPageScroll=e.throttle((function(){this.getBottomDistance()<=this.options.scrollThreshold&&this.dispatchEvent("scrollThreshold")})),n.getBottomDistance=function(){let e,i;return this.options.elementScroll?(e=this.scroller.scrollHeight,i=this.scroller.scrollTop+this.scroller.clientHeight):(e=this.top+this.element.clientHeight,i=t.scrollY+this.windowHeight),e-i},n.onResize=function(){this.updateMeasurements()},i.debounceMethod(e,"onResize",150),e})),function(t,e){"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,(function(t,e,i){let n=e.prototype;Object.assign(e.defaults,{history:"replace"});let o=document.createElement("a");return e.create.history=function(){if(!this.options.history)return;o.href=this.getAbsolutePath(),(o.origin||o.protocol+"//"+o.host)==location.origin?this.options.append?this.createHistoryAppend():this.createHistoryPageLoad():console.error(`[InfiniteScroll] cannot set history with different origin: ${o.origin} on ${location.origin} . History behavior disabled.`)},n.createHistoryAppend=function(){this.updateMeasurements(),this.updateScroller(),this.scrollPages=[{top:0,path:location.href,title:document.title}],this.scrollPage=this.scrollPages[0],this.scrollHistoryHandler=this.onScrollHistory.bind(this),this.unloadHandler=this.onUnload.bind(this),this.scroller.addEventListener("scroll",this.scrollHistoryHandler),this.on("append",this.onAppendHistory),this.bindHistoryAppendEvents(!0)},n.bindHistoryAppendEvents=function(e){let i=e?"addEventListener":"removeEventListener";this.scroller[i]("scroll",this.scrollHistoryHandler),t[i]("unload",this.unloadHandler)},n.createHistoryPageLoad=function(){this.on("load",this.onPageLoadHistory)},e.destroy.history=n.destroyHistory=function(){this.options.history&&this.options.append&&this.bindHistoryAppendEvents(!1)},n.onAppendHistory=function(t,e,i){if(!i||!i.length)return;let n=i[0],s=this.getElementScrollY(n);o.href=e,this.scrollPages.push({top:s,path:o.href,title:t.title})},n.getElementScrollY=function(e){if(this.options.elementScroll)return e.offsetTop-this.top;return e.getBoundingClientRect().top+t.scrollY},n.onScrollHistory=function(){let t=this.getClosestScrollPage();t!=this.scrollPage&&(this.scrollPage=t,this.setHistory(t.title,t.path))},i.debounceMethod(e,"onScrollHistory",150),n.getClosestScrollPage=function(){let e,i;e=this.options.elementScroll?this.scroller.scrollTop+this.scroller.clientHeight/2:t.scrollY+this.windowHeight/2;for(let t of this.scrollPages){if(t.top>=e)break;i=t}return i},n.setHistory=function(t,e){let i=this.options.history;i&&history[i+"State"]&&(history[i+"State"](null,t,e),this.options.historyTitle&&(document.title=t),this.dispatchEvent("history",null,[t,e]))},n.onUnload=function(){if(0===this.scrollPage.top)return;let e=t.scrollY-this.scrollPage.top+this.top;this.destroyHistory(),scrollTo(0,e)},n.onPageLoadHistory=function(t,e){this.setHistory(t.title,e)},e})),function(t,e){"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,(function(t,e,i){class n{constructor(t,e){this.element=t,this.infScroll=e,this.clickHandler=this.onClick.bind(this),this.element.addEventListener("click",this.clickHandler),e.on("request",this.disable.bind(this)),e.on("load",this.enable.bind(this)),e.on("error",this.hide.bind(this)),e.on("last",this.hide.bind(this))}onClick(t){t.preventDefault(),this.infScroll.loadNextPage()}enable(){this.element.removeAttribute("disabled")}disable(){this.element.disabled="disabled"}hide(){this.element.style.display="none"}destroy(){this.element.removeEventListener("click",this.clickHandler)}}return e.create.button=function(){let t=i.getQueryElement(this.options.button);t&&(this.button=new n(t,this))},e.destroy.button=function(){this.button&&this.button.destroy()},e.Button=n,e})),function(t,e){"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,(function(t,e,i){let n=e.prototype;function o(t){r(t,"none")}function s(t){r(t,"block")}function r(t,e){t&&(t.style.display=e)}return e.create.status=function(){let t=i.getQueryElement(this.options.status);t&&(this.statusElement=t,this.statusEventElements={request:t.querySelector(".infinite-scroll-request"),error:t.querySelector(".infinite-scroll-error"),last:t.querySelector(".infinite-scroll-last")},this.on("request",this.showRequestStatus),this.on("error",this.showErrorStatus),this.on("last",this.showLastStatus),this.bindHideStatus("on"))},n.bindHideStatus=function(t){let e=this.options.append?"append":"load";this[t](e,this.hideAllStatus)},n.showRequestStatus=function(){this.showStatus("request")},n.showErrorStatus=function(){this.showStatus("error")},n.showLastStatus=function(){this.showStatus("last"),this.bindHideStatus("off")},n.showStatus=function(t){s(this.statusElement),this.hideStatusEventElements(),s(this.statusEventElements[t])},n.hideAllStatus=function(){o(this.statusElement),this.hideStatusEventElements()},n.hideStatusEventElements=function(){for(let t in this.statusEventElements){o(this.statusEventElements[t])}},e})),
/*!
 * imagesLoaded v4.1.4
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */
function(t,e){"use strict";"function"==typeof define&&define.amd?define(["ev-emitter/ev-emitter"],(function(i){return e(t,i)})):"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter")):t.imagesLoaded=e(t,t.EvEmitter)}("undefined"!=typeof window?window:this,(function(t,e){"use strict";var i=t.jQuery,n=t.console;function o(t,e){for(var i in e)t[i]=e[i];return t}var s=Array.prototype.slice;function r(t,e,l){if(!(this instanceof r))return new r(t,e,l);var h,a=t;("string"==typeof t&&(a=document.querySelectorAll(t)),a)?(this.elements=(h=a,Array.isArray(h)?h:"object"==typeof h&&"number"==typeof h.length?s.call(h):[h]),this.options=o({},this.options),"function"==typeof e?l=e:o(this.options,e),l&&this.on("always",l),this.getImages(),i&&(this.jqDeferred=new i.Deferred),setTimeout(this.check.bind(this))):n.error("Bad element for imagesLoaded "+(a||t))}r.prototype=Object.create(e.prototype),r.prototype.options={},r.prototype.getImages=function(){this.images=[],this.elements.forEach(this.addElementImages,this)},r.prototype.addElementImages=function(t){"IMG"==t.nodeName&&this.addImage(t),!0===this.options.background&&this.addElementBackgroundImages(t);var e=t.nodeType;if(e&&l[e]){for(var i=t.querySelectorAll("img"),n=0;n<i.length;n++){var o=i[n];this.addImage(o)}if("string"==typeof this.options.background){var s=t.querySelectorAll(this.options.background);for(n=0;n<s.length;n++){var r=s[n];this.addElementBackgroundImages(r)}}}};var l={1:!0,9:!0,11:!0};function h(t){this.img=t}function a(t,e){this.url=t,this.element=e,this.img=new Image}return r.prototype.addElementBackgroundImages=function(t){var e=getComputedStyle(t);if(e)for(var i=/url\((['"])?(.*?)\1\)/gi,n=i.exec(e.backgroundImage);null!==n;){var o=n&&n[2];o&&this.addBackground(o,t),n=i.exec(e.backgroundImage)}},r.prototype.addImage=function(t){var e=new h(t);this.images.push(e)},r.prototype.addBackground=function(t,e){var i=new a(t,e);this.images.push(i)},r.prototype.check=function(){var t=this;function e(e,i,n){setTimeout((function(){t.progress(e,i,n)}))}this.progressedCount=0,this.hasAnyBroken=!1,this.images.length?this.images.forEach((function(t){t.once("progress",e),t.check()})):this.complete()},r.prototype.progress=function(t,e,i){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!t.isLoaded,this.emitEvent("progress",[this,t,e]),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,t),this.progressedCount==this.images.length&&this.complete(),this.options.debug&&n&&n.log("progress: "+i,t,e)},r.prototype.complete=function(){var t=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emitEvent(t,[this]),this.emitEvent("always",[this]),this.jqDeferred){var e=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[e](this)}},h.prototype=Object.create(e.prototype),h.prototype.check=function(){this.getIsImageComplete()?this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,this.proxyImage.addEventListener("load",this),this.proxyImage.addEventListener("error",this),this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.proxyImage.src=this.img.src)},h.prototype.getIsImageComplete=function(){return this.img.complete&&this.img.naturalWidth},h.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.img,e])},h.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},h.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},h.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},h.prototype.unbindEvents=function(){this.proxyImage.removeEventListener("load",this),this.proxyImage.removeEventListener("error",this),this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},a.prototype=Object.create(h.prototype),a.prototype.check=function(){this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.img.src=this.url,this.getIsImageComplete()&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},a.prototype.unbindEvents=function(){this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},a.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.element,e])},r.makeJQueryPlugin=function(e){(e=e||t.jQuery)&&((i=e).fn.imagesLoaded=function(t,e){return new r(this,t,e).jqDeferred.promise(i(this))})},r.makeJQueryPlugin(),r}));


[[={{ }}=]]



let infScroll = new InfiniteScroll( '.posts', {

  path: 'a.next-page',

  append: '.posts > a',
  // REQUIRED for appending content
  // Appends selected elements from loaded page to the container

  checkLastPage: true,
  // Checks if page has path selector element
  // Set to string if path is not set as selector string:
  //   checkLastPage: '.pagination__next'

  prefill: false,
  // Loads and appends pages on intialization until scroll requirement is met.

  responseBody: 'text',
  // Sets the method used on the response.
  // Set to 'json' to load JSON.

  domParseResponse: true,
  // enables parsing response body into a DOM
  // disable to load flat text

  outlayer: false,
  // Integrates Masonry, Isotope or Packery
  // Appended items will be added to the layout

  scrollThreshold: 600,
  // Sets the distance between the viewport to scroll area
  // for scrollThreshold event to be triggered.

  history: 'replace',
  // Changes the browser history and URL.
  // Set to 'push' to use history.pushState()
  //    to create new history entries for each page change.

  historyTitle: true,
  // Updates the window title. Requires history enabled.


  debug: false,
  // Logs events and state changes to the console.
})

infScroll.on( 'history', function( title, path ) {
  const pageNumber = parseInt(path.split('/').pop()) || 1;
  document.getElementById('current-page').innerHTML = pageNumber;
  document.querySelector('.next-page').href = '/page/' + (pageNumber+1);
  document.querySelector('.previous-page').href = '/page/'  + (pageNumber-1);
});


{{/infinite_scroll}}