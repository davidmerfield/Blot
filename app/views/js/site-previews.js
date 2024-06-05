const localforage = require('./localforage.js');

// The screenshot is taken of the preview inside a web browser
// these are the dimensions of the viewport
const SCREENSHOT_VIEWPORT_WIDTH = 1200;
const SCREENSHOT_VIEWPORT_HEIGHT = 800;

let currentPreviewIndex = 0;
let queue = [];

// Function to handle incoming messages and replace iframes with images
function handleMessage(event) {
    var iframes = document.querySelectorAll('.site-preview iframe');
    iframes.forEach(function (iframe) {
        if (event.source === iframe.contentWindow && event.data && event.data.type === 'screenshot') {

            console.log('recieved screenshot', iframe.parentNode.getAttribute('data-url'));
            var img = new Image();
            img.src = event.data.screenshot;

            // Replace the iframe with the image
            const parent = iframe.parentNode;
            parent.replaceChild(img, iframe);

            // Fade in the image with class 'fade-in'
            img.onload = function () {
                img.classList.add('fade-in');
            };

            // Cache the screenshot in localForage
            var cacheId = parent.getAttribute('data-cache-id');
            var previewUrl = parent.getAttribute('data-url');
            var cacheKey = cacheId + ':' + previewUrl;

            localforage.setItem(cacheKey, event.data.screenshot)
                .then(() => localforage.getItem(previewUrl + ':lastCacheID'))
                .then((lastCacheID) => {
                    // Remove old cache if cacheID has changed
                    if (lastCacheID && lastCacheID !== cacheId) {
                        localforage.removeItem(lastCacheID + ':' + previewUrl);
                    }

                    // Update the mapping of previewURL to cacheID
                    return localforage.setItem(previewUrl + ':lastCacheID', cacheId);
                })
                .catch((error) => {
                    console.error('Error caching screenshot:', error);
                })
                .finally(() => {
                    // Process the next preview in the queue
                    currentPreviewIndex++;
                    processNextPreview();
                });
        }
    });
}

// Listen for postMessage events from the iframes
window.addEventListener('message', handleMessage);

// Function to request a screenshot from the iframe 
function requestScreenshot(iframe) {
    iframe.contentWindow.postMessage({
        type: 'requestScreenshot',
    }, '*');
}

// Function to process the next preview in the queue
function processNextPreview() {

    if (currentPreviewIndex >= queue.length) return;

    const preview = queue[currentPreviewIndex];
    const previewUrl = preview.getAttribute('data-url');
    
    // Dynamically create the iframe and generate screenshot
    var iframe = document.createElement('iframe');
    iframe.src = previewUrl;
    iframe.style.width = SCREENSHOT_VIEWPORT_WIDTH + 'px';
    iframe.style.height = SCREENSHOT_VIEWPORT_HEIGHT + 'px';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    // silence the console in the iframe
    iframe.setAttribute('onload', 'this.contentWindow.console.log = function() {};');
    preview.appendChild(iframe);
    iframe.addEventListener('load', function () {
        requestScreenshot(iframe);
    });

    // handle errors as well, just process the next preview
    iframe.addEventListener('error', function () {
        currentPreviewIndex++;
        processNextPreview();
    });

}

// Initialize previews and start processing
const previews = document.querySelectorAll('.site-preview');

// Render cached screenshots first
Promise.all(Array.from(previews).map((preview) => {
    const cacheId = preview.getAttribute('data-cache-id');
    const previewUrl = preview.getAttribute('data-url');
    const cacheKey = cacheId + ':' + previewUrl;

    return localforage.getItem(cacheKey)
        .then((cachedScreenshot) => {
            if (cachedScreenshot) {
                // Use cached screenshot
                var img = new Image();
                img.src = cachedScreenshot;
                // Fade in the image with class 'fade-in'
                img.onload = function () {
                    img.classList.add('fade-in');
                };
                preview.appendChild(img);
            } else {
                console.log('No cached screenshot found:', previewUrl);
                // Add to queue for new screenshot generation
                queue.push(preview);
            }
        })
        .catch((error) => {
            console.error('Error retrieving cached screenshot:', error);
        });
})).then(() => {
    // Start processing the queue after initial rendering
    console.log('processing queue   ', queue);
    processNextPreview();
});

// Expose a function which can reset cached screenshots
window.resetCachedScreenshots = function () {
    localforage.clear()
        .then(() => {
            console.log('Cache cleared.');
        })
        .catch((error) => {
            console.error('Error clearing cache:', error);
        });
};