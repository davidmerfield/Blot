function truncateAll(node) {
  var nodes = Array.from(node.children);

  const {
    width
  } = node.getBoundingClientRect();

  const styles = window.getComputedStyle(node);

  const paddingWidth = parseFloat(styles.paddingLeft) +
    parseFloat(styles.paddingRight);

  const borderWidth = parseFloat(styles.borderLeftWidth) +
    parseFloat(styles.borderRightWidth);

  const trueWidth = width - paddingWidth - borderWidth;

  console.log('trueWidth of parent:', trueWidth);
  
  nodes.forEach(node=>node.style.maxWidth=Math.floor(trueWidth/nodes.length) + 'px');
  nodes.forEach(n => truncate(n, trueWidth / nodes.length));
}

// crops any given text to the size of the given target
function truncate(target) {
  const text = target.innerHTML;
  const fontStyle = window.getComputedStyle(target, null).getPropertyValue('font');
  const measure = getTextWidth(fontStyle);
  const ellipsisWidth = measure('...');
  const textWidth = measure(text);

  const {
    width
  } = target.getBoundingClientRect();

  const styles = window.getComputedStyle(target);

  const paddingWidth = parseFloat(styles.paddingLeft) +
    parseFloat(styles.paddingRight);

  const marginWidth = parseFloat(styles.marginLeft) +
    parseFloat(styles.marginRight);

  const borderWidth = parseFloat(styles.borderLeftWidth) +
    parseFloat(styles.borderRightWidth);

  const trueWidth = width - paddingWidth - borderWidth;

  maxWidth =  trueWidth - ellipsisWidth;

  if (target.clientWidth === 0) {
    return;
  }

  if (Math.round(textWidth) <= Math.round(target.clientWidth)) {
    return;
  }

  let cutPoint;
  let trimmedText = text;
  let trimmedTextWidth;

  do {
    cutPoint = Math.floor(trimmedText.length / 2);
    trimmedText = trimmedText.slice(0, cutPoint) + trimmedText.slice(cutPoint + 1, trimmedText.length);
    trimmedTextWidth = measure(trimmedText);
  } while (trimmedTextWidth >= maxWidth);

  const result = trimmedText.slice(0, cutPoint) + '...' + trimmedText.slice(cutPoint, trimmedText.length);


  target.innerHTML = result;
}


// uses canvas to measure given text width with given font styles
function getTextWidth(fontStyle) {
  // re-use canvas object for better performance
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = fontStyle;
  return function measure(text) {
    // For some reason, if you don't trim the text
    // chrome crashes when you measure the width
    // of '✺ ' I don't know why
    text = text.trim();
    const {
      width
    } = context.measureText(text);
    return width;

  };
}


document.querySelectorAll('.truncate').forEach(function(node){
  truncate(node);
});

document.querySelectorAll('.truncate-all').forEach(function(node){
  truncateAll(node);
});