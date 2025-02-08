const config = require('config');

const screenshotScripts = `
<script src="/html2canvas.min.js"></script>
<script>
function generateScreenshot(scale = 0.4) {
  // Get the current viewport dimensions
  const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

  html2canvas(document.body, {
      width: viewportWidth,
      height: viewportHeight,
      windowWidth: viewportWidth,
      windowHeight: viewportHeight,
      x: 0,
      y: 0,
      logging: false,
      useCORS: false,      
  }).then(fullCanvas => {


    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailContext = thumbnailCanvas.getContext('2d');
    thumbnailCanvas.width = viewportWidth * scale;
    thumbnailCanvas.height = viewportHeight * scale;
    thumbnailContext.drawImage(fullCanvas, 0, 0, viewportWidth * scale, viewportHeight * scale);

      const thumbnailDataUrl = thumbnailCanvas.toDataURL('image/png');

      window.parent.postMessage({ type: 'screenshot', screenshot: thumbnailDataUrl }, '*');
  }).catch(error => {
    window.parent.postMessage({ type: 'screenshot', screenshot: '' }, '*');
  });
}


window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'requestScreenshot') {
      generateScreenshot();
  }
});
</script>`;

module.exports = function injectScreenshotScript({output, protocol, hostname, blogID}) {

      // replace all URLs with the CDN URL with the local URL
      // so we have no cross-origin issues
      output = output.split(config.cdn.origin + '/' + blogID).join(protocol + '://' + hostname);
    
      output = output
        .split("</body>")
        .join(screenshotScripts + "</body>");
    
    return output;
}

