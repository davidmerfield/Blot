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



var candidates = sessionStorage.getItem("randomPostCandidates");

try {
  candidates = JSON.parse(candidates);  
  candidates = candidates.filter(function(pathname){
    return articles.indexOf(pathname) > -1 && 
    pathname !== window.location
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