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



let btn = document.querySelector('.mouse-cursor-gradient-tracking');
btn.onmousemove = function(e) {
  let rect = e.target.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  btn.style.setProperty('--x', x + 'px');
  btn.style.setProperty('--y', y + 'px');
}