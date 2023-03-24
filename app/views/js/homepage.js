var ul = document.querySelector("ul.who");
var MAX_FEATURED = 25;

if (ul) {
  for (var i = ul.children.length; i >= 2; i--) {
    let index = 1 + Math.floor(Math.random() * (i - 1));
    ul.appendChild(ul.children[index]);
  }

  for (var x = ul.children.length - 1; x >= MAX_FEATURED; x--) {
    ul.children[x].remove();
  }

  ul.appendChild(ul.children[0]);
} 