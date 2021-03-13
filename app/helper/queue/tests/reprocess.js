describe("Queue.reprocess", function () {
	require("./setup")();

	it("is exposed", function (done) {
		this.queue.reprocess(this.blog.id, done);
	});
});
