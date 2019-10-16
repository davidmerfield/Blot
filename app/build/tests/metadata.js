describe("metadata parser", function() {
  var Metadata = require("../metadata");

  it("parses metadata", function() {
    expect(
      Metadata(
        ["Page:yes", "Permalink:", "Date: 12/10/12", "", "# Hi"].join("\n")
      ).metadata
    ).toEqual({
      permalink: "",
      page: "yes",
      date: "12/10/12"
    });
  });

  it("parses metadata with Windows newlines", function() {
    expect(
      Metadata(
        ["Page:yes", "Permalink:", "Date: 12/10/12", "", "# Hi"].join("\r\n")
      ).metadata
    ).toEqual({
      permalink: "",
      page: "yes",
      date: "12/10/12"
    });
  });

  it("parses metadata with non-standard return character newlines", function() {
    expect(
      Metadata(
        ["Page:yes", "Permalink:", "Date: 12/10/12", "", "# Hi"].join("\r")
      ).metadata
    ).toEqual({
      permalink: "",
      page: "yes",
      date: "12/10/12"
    });
  });

  it("handles colons", function() {
    expect(
      Metadata(
        ["Author:me", "", "What about a colon in the next line: yes you."].join(
          "\n"
        )
      ).metadata
    ).toEqual({
      author: "me"
    });
  });

  it("stops parsing when a line lacks a colon", function() {
    expect(
      Metadata(["Author:me", "Hey", "Date: 1"].join("\n")).metadata
    ).toEqual({
      author: "me"
    });
  });

  it("handles spaces in the metadata key", function() {
    expect(Metadata(["Author name: Jason"].join("\n")).metadata).toEqual({
      "author name": "Jason"
    });
  });

  it("handles pure metadata", function() {
    expect(Metadata(["only:metadata", "in:this"].join("\n")).metadata).toEqual({
      only: "metadata",
      in: "this"
    });
  });

  it("ignores a title with a colon", function() {
    expect(
      Metadata(
        [
          "# Since the title: is on the first line, no metada should be extracted",
          "Date: 1"
        ].join("\n")
      ).metadata
    ).toEqual({});
  });

  it("does not interpret a URL as a metadata key", function() {
    expect(
      Metadata(["<a href='/'>http://example.com</a>"].join("\n")).metadata
    ).toEqual({});
  });

  it("parses a URL as a metadata value", function() {
    expect(
      Metadata(["Thumbnail: http://example.com/image.jpg"].join("\n")).metadata
    ).toEqual({ thumbnail: "http://example.com/image.jpg" });
  });
});
