require('./relativeDate.js');
require('./truncate.js');
require('./sync_status.js');
require('./instant.page.js');
require('./contact-form.js');
require('./tagify.js');
require('./examples.js');

// must come before copy-buttons.js so that the copy buttons are generated
require('./multi-lingual-code.js');

require('./copy-buttons.js');

if (document.cookie.indexOf("signed_into_blot") > -1) {
    document.querySelectorAll(".signed-out").forEach(function (node) {
      node.style.display = "none";
    });
    document.querySelectorAll(".signed-in").forEach(function(node){
      node.style.display = "block";
    })
} else {
    document.querySelectorAll(".signed-out").forEach(function (node) {
      node.style.display = "block";
    });
    document.querySelectorAll(".signed-in").forEach(function(node){
      node.style.display = "none";
    })
}
