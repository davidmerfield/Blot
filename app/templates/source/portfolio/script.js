{{{app_js}}}



/*! instant.page v1.2.2 - (C) 2019 Alexandre Dieulot - https://instant.page/license */
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

// end of instant.page

// Keep the collection an entry was opened from so its arrows stay within it.
// The chronological prev/next hrefs are only ever replaced once we know better.
var collectionKey = "portfolioCollection";
var cacheID = "{{cacheID}}";
var closeURL;

var articles = [{{#all_entries}}'{{{url}}}'{{^last}},{{/last}}{{/all_entries}}];

function closeEntry() {
  if (closeURL) {
    window.location.href = closeURL;
  } else if (document.referrer) {
    window.history.back();
  } else {
    window.location.href = '/';
  }
  return false;
}

function pathOf(url) {
  try {
    var u = new URL(url, window.location.href);
    return u.origin === window.location.origin ? u.pathname.replace(/\/+$/, "") || "/" : null;
  } catch (e) {
    return null;
  }
}

function parseListing(doc, url) {
  var entries = [];
  doc.querySelectorAll("a.collection-entry").forEach(function (a) {
    var path = pathOf(a.href);
    if (path && entries.indexOf(path) === -1) entries.push(path);
  });
  if (!entries.length) return null;

  function pagination(selector) {
    var a = doc.querySelector(selector);
    return a && a.getAttribute("href") ? a.href : null;
  }

  return {
    url: url.split("#")[0],
    entries: entries,
    next: pagination("a.collection-next"),
    previous: pagination("a.collection-previous")
  };
}

function readCollection() {
  try {
    var state = JSON.parse(sessionStorage.getItem(collectionKey));
    return state && state.cacheID === cacheID ? state : null;
  } catch (e) {
    return null;
  }
}

function writeCollection(state) {
  try {
    sessionStorage.setItem(collectionKey, JSON.stringify(state));
  } catch (e) {}
}

// Record the order shown by the listing before following one of its entries.
document.addEventListener("click", function (e) {
  if (!e.target.closest("a.collection-entry")) return;
  var listing = parseListing(document, window.location.href);
  if (listing) writeCollection({ cacheID: cacheID, listings: [listing] });
}, true);

function initializeCollectionNavigation() {
  var state = readCollection();
  // Only trust the collection when arriving from elsewhere on this site.
  if (!state || !pathOf(document.referrer)) return;

  var path = pathOf(window.location.href);
  var page = -1, index = -1;
  for (var n = 0; n < state.listings.length && index < 0; n++) {
    page = n;
    index = state.listings[n].entries.indexOf(path);
  }
  if (index < 0) return;

  var listing = state.listings[page];
  closeURL = listing.url;
  document.querySelectorAll("a.entry-close").forEach(function (a) {
    a.href = closeURL;
  });

  function edge(l, step) {
    return l.entries[step > 0 ? 0 : l.entries.length - 1];
  }

  // Resolves to the neighbour's path, null at the end of the collection, and
  // rejects when unsure (so the chronological link stays).
  function neighbor(direction) {
    var step = direction === "next" ? 1 : -1;
    if (listing.entries[index + step]) return Promise.resolve(listing.entries[index + step]);

    var loaded = state.listings[page + step];
    if (loaded) return Promise.resolve(edge(loaded, step));
    if (!listing[direction]) return Promise.resolve(null);

    return fetch(listing[direction], { credentials: "same-origin" }).then(function (res) {
      if (!res.ok) throw new Error("Could not load collection page");
      return res.text().then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var fetched = parseListing(doc, res.url);
        if (!fetched) return null;
        state.listings[step > 0 ? "push" : "unshift"](fetched);
        writeCollection(state);
        return edge(fetched, step);
      });
    });
  }

  [["a.entry-previous", "previous"], ["a.entry-next", "next"]].forEach(function (pair) {
    var link = document.querySelector(pair[0]);
    if (!link) return;
    neighbor(pair[1]).then(function (target) {
      if (target) {
        link.href = window.location.origin + target;
      } else {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
      }
    }, function () {});
  });
}

initializeCollectionNavigation();

document.addEventListener("keydown", function (e) {
  var selector = { 37: "a.entry-previous", 39: "a.entry-next" }[e.keyCode];
  var link = selector && document.querySelector(selector);
  if (link && link.href) window.location.href = link.href;
});

var candidates = sessionStorage.getItem("randomPostCandidates");

try {
  candidates = JSON.parse(candidates);  
  candidates = candidates.filter(function(pathname){
    return articles.indexOf(pathname) > -1 && 
    pathname !== window.location.pathname
  });
  if (candidates.length === 0) candidates = articles;
} catch (e) {
  candidates = articles.slice();
}

sessionStorage.setItem("randomPostCandidates", JSON.stringify(candidates));

function randomPost () {

  window.location = candidates[Math.floor(Math.random() * candidates.length)];

  return false;
}
