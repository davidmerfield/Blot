{{{appJS}}}

var articles = [{{#allEntries}}"{{{url}}}"{{^last}},{{/last}}{{/allEntries}}];
var visitedPosts = sessionStorage.getItem("visitedPosts");

try {
  visitedPosts = JSON.parse(visitedPosts);  
  visitedPosts.push(window.location);
} catch (e) {
  visitedPosts = [window.location];
}

sessionStorage.setItem("visitedPosts", JSON.stringify(visitedPosts.slice(-100)));

function lastIndexPage () {
  
  var backIndex = null;

  visitedPosts.slice().reverse().forEach(function(item, i) {
          
    // console.log(backIndex, item.pathname, articles.indexOf(item.pathname));

    if (backIndex === null && articles.indexOf(item.pathname) === -1) {
      backIndex = i;
      return false;
    }
  });

  // console.log('BACK INDEX', backIndex);

  if (backIndex !== null) 
    window.history.go(-backIndex);
  else 
    window.location = '/';

  return false;
}

var candidates = sessionStorage.getItem("randomPostCandidates");

try {
  candidates = JSON.parse(candidates);  
  candidates = candidates.filter(function(pathname){return pathname !== window.location});
  if (candidates.length === 0) candidates = articles;
} catch (e) {
  candidates = articles.slice();
}

sessionStorage.setItem("randomPostCandidates", JSON.stringify(candidates));

function randomPost () {

  window.location = candidates[Math.floor(Math.random() * candidates.length)];

  return false;
}