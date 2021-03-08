var Entries = require("entries");

module.exports = function(req, callback) {

	console.log('HERE!');

	var blog = req.blog;

	var pageNo, pageSize;

	try {
		pageNo = parseInt(req.params.page) || parseInt(req.query.page) || 1;
	} catch (e) {
		pageNo = 1;
	}

	try {
		// when I remove the blog.pageSize option,
		// consider users whove customized the page size
		// but use a default template...
		pageSize = req.template.locals.page_size || req.blog.pageSize;
		pageSize = parseInt(pageSize) || 5;
	} catch (e) {
		pageSize = 5;
	}

	Entries.getPage(blog.id, pageNo, pageSize, function(posts, pagination) {
		var pageTitle = blog.title;

		if (pageNo > 1) {
			pageTitle = "Page " + pageNo + " of " + pageTitle;
		}

		pagination.current = pageNo;

		return callback(null, {
			posts: posts,
			next: pagination.next,
			total: pagination.total,
			previous: pagination.previous,
			current: pageNo
		});
	});
};
