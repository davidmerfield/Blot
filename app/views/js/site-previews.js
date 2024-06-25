const localforage = require('./localforage.js');

const TIMEOUT_MS = 5000;

const SCREENSHOT_VIEWPORT_WIDTH = 1200;
const SCREENSHOT_VIEWPORT_HEIGHT = 800;

let currentPreviewIndex = 0;
let queue = [];

async function requestScreenshot(iframe) {

    const cacheId = iframe.parentNode.getAttribute('data-cache-id');
    const previewUrl = iframe.parentNode.getAttribute('data-url');
    const cacheKey = `${cacheId}:${previewUrl}`;

    const handleMessage = async (event) => {

        if (event.source !== iframe.contentWindow) return;

        if (!event.data || event.data.type !== 'screenshot') return;

        if (event.data.screenshot === '') {
            window.removeEventListener('message', handleMessage);
            currentPreviewIndex++;
            processNextPreview();
            return;
        }

        renderImage(event.data.screenshot, iframe.parentNode);

        try {
            await localforage.setItem(cacheKey, event.data.screenshot);

            const lastCacheID = await localforage.getItem(`${previewUrl}:lastCacheID`);

            if (lastCacheID && lastCacheID !== cacheId) {
                await localforage.removeItem(`${lastCacheID}:${previewUrl}`);
            }

            await localforage.setItem(`${previewUrl}:lastCacheID`, cacheId);
        } catch (error) {
            console.error('Error caching screenshot:', error);
        } finally {
            window.removeEventListener('message', handleMessage);
            currentPreviewIndex++;
            processNextPreview();
        }
    };

    window.addEventListener('message', handleMessage);

    iframe.contentWindow.postMessage(
        {
            type: 'requestScreenshot',
        },
        '*'
    );

    setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        currentPreviewIndex++;
        processNextPreview();
    }, TIMEOUT_MS);
}

function processNextPreview() {
    if (currentPreviewIndex >= queue.length) return;

    const preview = queue[currentPreviewIndex];
    const previewUrl = preview.getAttribute('data-url');

    const iframe = document.createElement('iframe');
    iframe.src = previewUrl;
    iframe.style.width = `${SCREENSHOT_VIEWPORT_WIDTH}px`;
    iframe.style.height = `${SCREENSHOT_VIEWPORT_HEIGHT}px`;
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    preview.appendChild(iframe);

    iframe.addEventListener('load', function () {
        requestScreenshot(iframe);
    });

    iframe.addEventListener('error', function () {
        currentPreviewIndex++;
        processNextPreview();
    });
}

async function initializePreviews() {
    const previews = document.querySelectorAll('.site-preview');

    await Promise.all(
        Array.from(previews).map(async (preview) => {
            try {
                const previewUrl = preview.getAttribute('data-url');
                const cacheId = preview.getAttribute('data-cache-id');
                const fallbackImage = preview.getAttribute('data-fallback-image');
                const lastCacheID = await localforage.getItem(`${previewUrl}:lastCacheID`);
                const cachedScreenshot = !!lastCacheID && await localforage.getItem(`${lastCacheID}:${previewUrl}`);

                if (cachedScreenshot) {
                    renderImage(cachedScreenshot, preview);
                } else if (fallbackImage) {
                    console.log('Rendering fallback image', fallbackImage);
                    renderImage(fallbackImage, preview);
                }

                if (!cachedScreenshot || lastCacheID !== cacheId) {
                    queue.push(preview);
                }

            } catch (error) {
                queue.push(preview);
            }
        })
    );

    processNextPreview();
}

initializePreviews();

window.resetCachedScreenshots = async function () {
    try {
        await localforage.clear();
        console.log('Cache cleared.');
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

const renderImage = (src, node) => {
    // if there is already an image, remove it
    const existingImage = node.querySelector('img');

    if (existingImage) {
        node.removeChild(existingImage);
    }

    // if there is an iframe in the node, remove it
    const existingIframe = node.querySelector('iframe');

    if (existingIframe) {
        node.removeChild(existingIframe);
    }

    const img = new Image();

    img.src = src;

    img.onload = function () {
        img.classList.add('fade-in');
    };
    
    node.appendChild(img);
}