{{{appJS}}}


/*


Mouse-cursor tracking for links

Follows the cursor with a subtle highlight effect

*/


let linksToTrack = document.querySelector('.cursor-tracking');
linksToTrack.onmousemove = function(e) {
  let rect = e.target.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  linksToTrack.style.setProperty('--x', x + 'px');
  linksToTrack.style.setProperty('--y', y + 'px');
} 