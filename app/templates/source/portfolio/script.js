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

// Keep the collection that an entry was opened from so its arrows stay within it.
var collectionNavigationKey = "portfolioCollectionNavigation";

function collectionPath(url) {
  try {
    var parsed = new URL(url, window.location.href);
    if (parsed.origin !== window.location.origin) return null;
    return parsed.pathname.replace(/\/+$/, "") || "/";
  } catch (e) {
    return null;
  }
}

function collectionPageFromDocument(doc, url) {
  var entries = [];
  var seen = {};

  doc.querySelectorAll("a.collection-entry").forEach(function (link) {
    var path = collectionPath(link.href);
    if (!path || seen[path]) return;
    seen[path] = true;
    entries.push(path);
  });

  if (!entries.length) return null;

  function paginationURL(selector) {
    var link = doc.querySelector(selector);
    return link && link.hasAttribute("href") ? link.href : null;
  }

  var pageURL = new URL(url, window.location.href);
  pageURL.hash = "";

  return {
    url: pageURL.href,
    entries: entries,
    next: paginationURL("a.collection-next"),
    previous: paginationURL("a.collection-previous")
  };
}

function readCollectionNavigation() {
  try {
    return JSON.parse(sessionStorage.getItem(collectionNavigationKey) || "null");
  } catch (e) {
    return null;
  }
}

function writeCollectionNavigation(state) {
  try {
    sessionStorage.setItem(collectionNavigationKey, JSON.stringify(state));
  } catch (e) {}
}

function currentCollectionPosition() {
  var state = readCollectionNavigation();
  if (!state || !Array.isArray(state.pages)) return null;

  var path = collectionPath(window.location.href);
  for (var pageIndex = 0; pageIndex < state.pages.length; pageIndex++) {
    var page = state.pages[pageIndex];
    if (!page || !Array.isArray(page.entries)) continue;
    var entryIndex = page.entries.indexOf(path);
    if (entryIndex !== -1) {
      return { state: state, page: page, pageIndex: pageIndex, entryIndex: entryIndex };
    }
  }

  return null;
}

// Close to the listing page containing this entry; fall back to browser history
// when the entry was opened outside one of the portfolio's collections.
function closeEntry() {
  var position = currentCollectionPosition();
  if (position) {
    window.location.href = position.page.url;
  } else if (document.referrer && collectionPath(document.referrer)) {
    window.history.back();
  } else {
    window.location.href = "/";
  }
  return false;
}

// Capture the exact order shown by each collection page before following an entry.
document.addEventListener("click", function (event) {
  var link = event.target.closest && event.target.closest("a.collection-entry");
  if (!link) return;

  var page = collectionPageFromDocument(document, window.location.href);
  if (!page) return;

  writeCollectionNavigation({ pages: [page] });
}, true);

function initializeCollectionNavigation() {
  var position = currentCollectionPosition();
  if (!position) return;

  var previousLink = document.querySelector("a.entry-previous");
  var nextLink = document.querySelector("a.entry-next");
  var closeLinks = document.querySelectorAll("a.entry-close");

  closeLinks.forEach(function (link) {
    link.href = position.page.url;
  });

  function setTarget(link, path) {
    if (!link) return;
    if (path) {
      link.href = window.location.origin + path;
      link.removeAttribute("aria-disabled");
    } else {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
    }
  }

  function pageEntriesFor(position, direction) {
    var page = position.page;
    var entryIndex = position.entryIndex;
    var inPageIndex = entryIndex + (direction === "next" ? 1 : -1);

    if (inPageIndex >= 0 && inPageIndex < page.entries.length) {
      return Promise.resolve(page.entries[inPageIndex]);
    }

    var neighborPage = position.state.pages[
      position.pageIndex + (direction === "next" ? 1 : -1)
    ];
    if (neighborPage) {
      return Promise.resolve(
        direction === "next"
          ? neighborPage.entries[0]
          : neighborPage.entries[neighborPage.entries.length - 1]
      );
    }

    var pageURL = direction === "next" ? page.next : page.previous;
    if (!pageURL) return Promise.resolve(null);

    return fetch(pageURL, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("Could not load collection page");
        return response.text().then(function (html) {
          return { html: html, url: response.url || pageURL };
        });
      })
      .then(function (result) {
        var doc = new DOMParser().parseFromString(result.html, "text/html");
        var fetchedPage = collectionPageFromDocument(doc, result.url);
        if (!fetchedPage) return null;

        var alreadyLoaded = position.state.pages.some(function (loadedPage) {
          return loadedPage.url === fetchedPage.url;
        });
        if (!alreadyLoaded) {
          if (direction === "next") {
            position.state.pages.push(fetchedPage);
          } else {
            position.state.pages.unshift(fetchedPage);
          }
        }

        writeCollectionNavigation(position.state);
        return direction === "next"
          ? fetchedPage.entries[0]
          : fetchedPage.entries[fetchedPage.entries.length - 1];
      });
  }

  function updateArrow(link, direction) {
    var step = direction === "next" ? 1 : -1;
    var atBoundary = position.entryIndex + step < 0 ||
      position.entryIndex + step >= position.page.entries.length;
    var loadedNeighbor = position.state.pages[position.pageIndex + step];
    var needsFetch = atBoundary && !loadedNeighbor &&
      (direction === "next" ? position.page.next : position.page.previous);
    var fallback = link && link.getAttribute("href");

    if (needsFetch && link) {
      link.removeAttribute("href");
      link.setAttribute("aria-busy", "true");
    }

    pageEntriesFor(position, direction)
      .then(function (path) { setTarget(link, path); })
      .catch(function () {
        if (needsFetch && link && fallback) link.href = fallback;
      })
      .then(function () {
        if (link) link.removeAttribute("aria-busy");
      });
  }

  updateArrow(previousLink, "previous");
  updateArrow(nextLink, "next");
}

initializeCollectionNavigation();

var articles = [{{#all_entries}}'{{{url}}}'{{^last}},{{/last}}{{/all_entries}}];
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
