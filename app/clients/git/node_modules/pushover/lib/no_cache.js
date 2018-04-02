module.exports = function (res) {
    res.setHeader('expires', 'Fri, 01 Jan 1980 00:00:00 GMT');
    res.setHeader('pragma', 'no-cache');
    res.setHeader('cache-control', 'no-cache, max-age=0, must-revalidate');
};
