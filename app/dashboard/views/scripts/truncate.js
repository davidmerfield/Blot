// crops any given text to the size of the given target
function truncate(target) {

  const storedText =  target.getAttribute('data-text');
  
  if (storedText) {
    target.innerHTML = storedText;
  } else {
    target.setAttribute('data-text', target.innerHTML);
  }

  const text = target.innerHTML;

  const fontStyle = window.getComputedStyle(target, null).getPropertyValue('font');


  /** recursively splices text from the middle by one char at a time 
   * until text fits to given maxWidth
   * then inserts the ellipsis in the middle
   **/
  sliceIfNotFitting(target, text, fontStyle);
}

function sliceIfNotFitting(target, text, fontStyle, cutPoint) {

  const ellipsisWidth = getTextWidth('...', fontStyle);
  const maxWidth = Math.floor(target.clientWidth - ellipsisWidth);
  var textWidth = getTextWidth(text, fontStyle);

  if (target.clientWidth === 0 || 
     cutPoint === undefined && Math.round(textWidth) <= Math.round(target.clientWidth)) {
    return target.innerHTML = text;
  }

  if (cutPoint === undefined) {
    cutPoint = Math.floor(text.length / 2)
  }

  if (textWidth > maxWidth) {
    cutPoint = Math.floor(text.length / 2);
    text = text.slice(0, cutPoint) + text.slice(cutPoint + 1, text.length);
    // console.log('cropping', textWidth, text);
    sliceIfNotFitting(target, text, fontStyle, cutPoint);
  } else {
    //  console.log('now it is good', text, textWidth)
    // now add ellipsis we should all be good now
    console.log('satisfied with', text, maxWidth);
    target.innerHTML = text.slice(0, cutPoint) + '...' + text.slice(cutPoint, text.length);
  }

}

// uses canvas to measure given text width with given font styles
function getTextWidth(text, font) {
  // re-use canvas object for better performance
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const {width} = context.measureText(text);
  return width;
}

// you can change the input width from the css
document.querySelectorAll('.truncate').forEach(truncate);

window.addEventListener('resize', function(event) {
  document.querySelectorAll('.truncate').forEach(truncate);
}, true);


