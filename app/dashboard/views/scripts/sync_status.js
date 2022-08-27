var evtSource = new EventSource(syncStatusURL);
var currentlyLoading;
var lastStatus;
var checkAgain;

evtSource.onmessage = function (event) {
  // Fetch the latest folder state if we're not
  // already fetching it.
  if (currentlyLoading) {
    checkAgain = true;
    return;
  }

  currentlyLoading = true;

  loadFolder(function onLoad() {
    if (checkAgain === true) {
      checkAgain = false;
      return loadFolder(onLoad);
    }

    currentlyLoading = false;
  });

  lastStatus = event.data;
  document.getElementById("status").innerHTML = lastStatus;
  if (lastStatus === "Synced") {
    document.getElementById("status").className = "";
  } else {
    document.getElementById("status").className = "syncing";
  }
};

function loadFolder(callback) {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function (e) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var parser = new DOMParser();
      var xml = parser.parseFromString(xhr.responseText, "text/html");

      var currentNode = document.querySelector(".live-updates");
      var newNode = xml.querySelector(".live-updates");

      if (currentNode !== null && newNode !== null) {
        var currentState = currentNode.innerHTML;
        var newState = newNode.innerHTML;

        if (newState === currentState) return callback();
        currentNode.innerHTML = newState;
        var statusDiv = document.getElementById("status");
        if (statusDiv) statusDiv.innerHTML = lastStatus;
      }

      callback();
    }
  };

  xhr.open("GET", window.location, true);
  xhr.setRequestHeader("Content-type", "text/html");
  xhr.send();
}
