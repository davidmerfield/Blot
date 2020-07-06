var makeTeaser = require("../teaser");

describe("teaser parser", function() {
	function test(html, expected, expectedNewHTML, expectedMore) {
		var teaser = makeTeaser(html) || html;

		it("generates a correct teaser for " + html, function() {
			expect(teaser).toEqual(expected);
			if (expectedMore) expect(expectedMore).toEqual(teaser !== html);
		});
	}

	test(
		"<p>A</p><p>B</p><p>&lt;!- more -&gt;</p>",
		"<p>A</p><p>B</p>",
		"<p>A</p><p>B</p>",
		false
	);

	test(
		"<p>A</p><p>&lt;!&#x2014; more &#x2014;&gt;</p><p>C</p>",
		"<p>A</p>",
		"<p>A</p><p>C</p>",
		true
	);

	test(
		"<p>A<!-- more -->BCD<i>a</i></p><p>D</p>",
		"<p>A</p>",
		"<p>ABCD<i>a</i></p><p>D</p>",
		true
	);

	test(
		"<p>A</p><p>B</p><p>Goodbye &lt;!- more -&gt; Hello</p>",
		"<p>A</p><p>B</p><p>Goodbye </p>",
		"<p>A</p><p>B</p><p>Goodbye  Hello</p>",
		true
	);

	test(
		"<p>A</p><p>B</p><p>C</p><!-- more --><p>D</p>",
		"<p>A</p><p>B</p><p>C</p>",
		"<p>A</p><p>B</p><p>C</p><p>D</p>",
		true
	);

	test("<p>A<!-- more -->BCD</p>", "<p>A</p>", "<p>ABCD</p>", true);

	test(
		"<p>A<!-- more -->BCD</p><p>D</p>",
		"<p>A</p>",
		"<p>ABCD</p><p>D</p>",
		true
	);

	test(
		"Hello {{more}} there {{more}} is...",
		"Hello ",
		"Hello  there {{more}} is...",
		true
	);

	test(
		"Hello {{more}} there is more to come...",
		"Hello ",
		"Hello  there is more to come...",
		true
	);

	test(
		"<script>var a;</script><h1>A</h1><p>B</p><p>C</p><p>D</p><p>E</p><p>F</p><p>G</p>",
		"<script>var a;</script><h1>A</h1><p>B</p><p>C</p><p>D</p><p>E</p>",
		"<script>var a;</script><h1>A</h1><p>B</p><p>C</p><p>D</p><p>E</p><p>F</p><p>G</p>",
		true
	);

	test(
		"<h1>A</h1><p>B</p><p>C</p>",
		"<h1>A</h1><p>B</p><p>C</p>",
		"<h1>A</h1><p>B</p><p>C</p>",
		false
	);
});
