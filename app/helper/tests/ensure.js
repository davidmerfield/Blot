describe("ensure ", function () {
  var ensure = require("../ensure");

  it("checks an object matches a model", function () {
    var model = {
      a: [{ b: "string", c: "number" }],
      d: { g: { h: { i: [{ j: "string", k: "number" }] } } },
    };

    var test = {
      a: [
        { b: "x", c: 1 },
        { b: "y", c: 2 },
        { b: "z", c: 3 },
      ],
      d: {
        g: {
          h: {
            i: [
              { j: "", k: 0 },
              { j: "", k: 2 },
            ],
          },
        },
      },
    };
    expect(function () {
      ensure(test, model);
    }).not.toThrow();
  });

  it("throws an error if an object has nested properties that do not match a model", function () {
    var model2 = { a: { b: { c: "string" } } };

    var test2 = { a: { b: { c: 1 } } };

    expect(function () {
      ensure(test2, model2);
    }).toThrow();
  });

  it("checks an object matches a model with an array", function () {
    var model3 = { a: [{ b: "number", d: [{ e: "string", f: "number" }] }] };

    var test3 = {
      a: [
        {
          b: 1,
          d: [
            { e: "1", f: 2 },
            { e: "2", f: 3 },
            { e: "3", f: 4 },
          ],
        },
        {
          b: 2,
          d: [
            { e: "3", f: 5 },
            { e: "4", f: 6 },
            { e: "5", f: 7 },
          ],
        },
      ],
    };
    expect(function () {
      ensure(test3, model3);
    }).not.toThrow();
  });

  it("throws an error if an object does not match a model", function () {
    var model4 = { a: "string", b: "number", c: "boolean", d: { e: "string" } };

    var test4 = { a: "defghi", b: 12345555, c: "       " };

    expect(function () {
      ensure(test4, model4);
    }).toThrow();
  });
});
