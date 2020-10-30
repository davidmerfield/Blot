{{{appJS}}}


// This mess works out the correct breakpoint at which the nav will fail

// First, we temporarily reset the breakpoint width to make proper measurements further down
for (var i = 0; i < document.styleSheets[0].rules.length; i++){
  var rule = document.styleSheets[0].rules[i];
  if (!rule.media) continue;
  var mediaText = rule.media.mediaText;
  if (mediaText.indexOf('(') === -1 || mediaText.indexOf(')') === -1) continue;
  var condition = mediaText.slice(mediaText.indexOf('(') + 1, mediaText.lastIndexOf(')'));
  var breakpoint = condition.slice(condition.indexOf(':') + 1).trim();
  rule.media.mediaText = rule.media.mediaText.split(breakpoint).join('0px');
  console.log(rule.media.mediaText);
}

var nav = document.querySelector('.navigation-container').cloneNode(true);

var testerWrapper = document.createElement("div")
testerWrapper.style.position = 'absolute';
testerWrapper.style.bottom = '-100px';
testerWrapper.style.left = '0';
testerWrapper.style.width = '10000px';

var tester = document.createElement("div")

tester.style.position = 'absolute';
tester.style.top = '0';
tester.style.left = '0';

tester.appendChild(nav);
testerWrapper.appendChild(tester);
document.body.appendChild(testerWrapper);

var actual_breakpoint = tester.offsetWidth;
document.body.removeChild(testerWrapper);

var totalRules = document.styleSheets[0].rules.length;
for (var i = 0; i < totalRules; i++){
  var rule = document.styleSheets[0].rules[i];
  if (!rule.media) continue;
  var mediaText = rule.media.mediaText;
  if (mediaText.indexOf('(') === -1 || mediaText.indexOf(')') === -1) continue;
  var condition = mediaText.slice(mediaText.indexOf('(') + 1, mediaText.lastIndexOf(')'));
  var breakpoint = condition.slice(condition.indexOf(':') + 1).trim();
  rule.media.mediaText = rule.media.mediaText.split(breakpoint).join(actual_breakpoint + 'px');
}



let btn = document.querySelector('.cursor-tracking');
btn.onmousemove = function(e) {
  let rect = e.target.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  btn.style.setProperty('--x', x + 'px');
  btn.style.setProperty('--y', y + 'px');
}






/*


instant.page v1.2.2

(C) 2019 Alexandre Dieulot - https://instant.page/license


 */
let urlToPreload
let mouseoverTimer
let lastTouchTimestamp

const prefetcher = document.createElement('link')
const isSupported = prefetcher.relList && prefetcher.relList.supports && prefetcher.relList.supports('prefetch')
const isDataSaverEnabled = navigator.connection && navigator.connection.saveData
const allowQueryString = 'instantAllowQueryString' in document.body.dataset
const allowExternalLinks = 'instantAllowExternalLinks' in document.body.dataset

if (isSupported && !isDataSaverEnabled) {
  prefetcher.rel = 'prefetch'
  document.head.appendChild(prefetcher)

  const eventListenersOptions = {
    capture: true,
    passive: true,
  }
  document.addEventListener('touchstart', touchstartListener, eventListenersOptions)
  document.addEventListener('mouseover', mouseoverListener, eventListenersOptions)
}

function touchstartListener(event) {
  /* Chrome on Android calls mouseover before touchcancel so `lastTouchTimestamp`
   * must be assigned on touchstart to be measured on mouseover. */
  lastTouchTimestamp = performance.now()

  const linkElement = event.target.closest('a')

  if (!isPreloadable(linkElement)) {
    return
  }

  linkElement.addEventListener('touchcancel', touchendAndTouchcancelListener, {passive: true})
  linkElement.addEventListener('touchend', touchendAndTouchcancelListener, {passive: true})

  urlToPreload = linkElement.href
  preload(linkElement.href)
}

function touchendAndTouchcancelListener() {
  urlToPreload = undefined
  stopPreloading()
}

function mouseoverListener(event) {
  if (performance.now() - lastTouchTimestamp < 1100) {
    return
  }

  const linkElement = event.target.closest('a')

  if (!isPreloadable(linkElement)) {
    return
  }

  linkElement.addEventListener('mouseout', mouseoutListener, {passive: true})

  urlToPreload = linkElement.href

  mouseoverTimer = setTimeout(() => {
    preload(linkElement.href)
    mouseoverTimer = undefined
  }, 65)
}

function mouseoutListener(event) {
  if (event.relatedTarget && event.target.closest('a') == event.relatedTarget.closest('a')) {
    return
  }

  if (mouseoverTimer) {
    clearTimeout(mouseoverTimer)
    mouseoverTimer = undefined
  }
  else {
    urlToPreload = undefined
    stopPreloading()
  }
}

function isPreloadable(linkElement) {
  if (!linkElement || !linkElement.href) {
    return
  }

  if (urlToPreload == linkElement.href) {
    return
  }

  const preloadLocation = new URL(linkElement.href)

  if (!allowExternalLinks && preloadLocation.origin != location.origin && !('instant' in linkElement.dataset)) {
    return
  }

  if (!['http:', 'https:'].includes(preloadLocation.protocol)) {
    return
  }

  if (preloadLocation.protocol == 'http:' && location.protocol == 'https:') {
    return
  }

  if (!allowQueryString && preloadLocation.search && !('instant' in linkElement.dataset)) {
    return
  }

  if (preloadLocation.hash && preloadLocation.pathname + preloadLocation.search == location.pathname + location.search) {
    return
  }

  if ('noInstant' in linkElement.dataset) {
    return
  }

  return true
}

function preload(url) {
  prefetcher.href = url
}

function stopPreloading() {
  prefetcher.removeAttribute('href')
}