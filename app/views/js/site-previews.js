const localforage = require('./localforage.js');

// The screenshot is taken of the preview inside a web browser
// these are the dimensions of the viewport
const SCREENSHOT_VIEWPORT_WIDTH = 1200;
const SCREENSHOT_VIEWPORT_HEIGHT = 800;

let currentPreviewIndex = 0;
let queue = [];

// Function to request a screenshot from the iframe and handle the response
async function requestScreenshot(iframe) {
    const handleMessage = async (event) => {
        if (event.source === iframe.contentWindow && event.data && event.data.type === 'screenshot') {
            var img = new Image();
            img.src = event.data.screenshot;

            const parent = iframe.parentNode;

            // remove the iframe
            parent.removeChild(iframe);
            // remove an existing image if it exists
            const existingImage = parent.querySelector('img');
            if (existingImage) {
                parent.removeChild(existingImage);
            }

            parent.appendChild(img);


            // Fade in the image with class 'fade-in'
            img.onload = function () {
                img.classList.add('fade-in');
            };

            // Cache the screenshot in localForage
            const cacheId = parent.getAttribute('data-cache-id');
            const previewUrl = parent.getAttribute('data-url');
            const cacheKey = cacheId + ':' + previewUrl;

            try {
                await localforage.setItem(cacheKey, event.data.screenshot);
                const lastCacheID = await localforage.getItem(previewUrl + ':lastCacheID');
                
                // Remove old cache if cacheID has changed
                if (lastCacheID && lastCacheID !== cacheId) {
                    await localforage.removeItem(lastCacheID + ':' + previewUrl);
                }

                // Update the mapping of previewURL to cacheID
                await localforage.setItem(previewUrl + ':lastCacheID', cacheId);
            } catch (error) {
                console.error('Error caching screenshot:', error);
            } finally {
                // Clean up: remove the message event listener
                window.removeEventListener('message', handleMessage);
                // Process the next preview in the queue
                currentPreviewIndex++;
                processNextPreview();
            }
        }
    };

    // Listen for postMessage events from the iframe
    window.addEventListener('message', handleMessage);

    // Send a message to the iframe to request a screenshot
    iframe.contentWindow.postMessage({
        type: 'requestScreenshot',
    }, '*');

    // Set a timeout to handle cases where the iframe fails to respond
    setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        currentPreviewIndex++;
        processNextPreview();
    }, 5000);
}

// Function to process the next preview in the queue
function processNextPreview() {
    if (currentPreviewIndex >= queue.length) return;

    const preview = queue[currentPreviewIndex];
    const previewUrl = preview.getAttribute('data-url');

    // Dynamically create the iframe and generate screenshot
    const iframe = document.createElement('iframe');
    iframe.src = previewUrl;
    iframe.style.width = SCREENSHOT_VIEWPORT_WIDTH + 'px';
    iframe.style.height = SCREENSHOT_VIEWPORT_HEIGHT + 'px';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    // silence the console in the iframe
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
async function initializePreviews() {
    const previews = document.querySelectorAll('.site-preview');

    // Render cached screenshots first
    await Promise.all(Array.from(previews).map(async (preview) => {
        try {
            const lastCacheID = await localforage.getItem(previewUrl + ':lastCacheID');
            const cacheId = preview.getAttribute('data-cache-id');
            const previewUrl = preview.getAttribute('data-url');

            let shouldGenerateScreenshot = true;

            if (lastCacheID) {

                const cachedScreenshot = await localforage.getItem(lastCacheID + ':' + previewUrl);

                if (cachedScreenshot) {
                    const img = new Image();
                    img.src = cachedScreenshot;
                    // Fade in the image with class 'fade-in'
                    img.onload = function () {
                        img.classList.add('fade-in');
                    };
                    preview.appendChild(img);
                } else {
                    useCachedScreenshot = false;
                }

                // Check if the cache ID matches
                if (lastCacheID !== cacheId) {
                    useCachedScreenshot = false;
                }
            }

            if (!lastCacheID || !useCachedScreenshot) {
                // If there is no lastCacheID or we can't use the cached screenshot, add to queue
                queue.push(preview);
            }
        } catch (error) {
            // In case of an error, add to queue for new screenshot generation
            queue.push(preview);
        }
    }));

    // Start processing the queue after initial rendering
    processNextPreview();
}

initializePreviews();

// Expose a function which can reset cached screenshots
window.resetCachedScreenshots = async function () {
    try {
        await localforage.clear();
        console.log('Cache cleared.');
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};