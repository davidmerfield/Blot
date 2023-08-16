describe("questions", function () {
  require("./setup")();

  it("exports the expected API surface", function () {
    const questions = require("../index");
    expect(questions).toEqual(jasmine.any(Object));
    expect(questions.create).toEqual(jasmine.any(Function));
    expect(questions.get).toEqual(jasmine.any(Function));
    expect(questions.update).toEqual(jasmine.any(Function));
    expect(questions.list).toEqual(jasmine.any(Function));
    expect(questions.search).toEqual(jasmine.any(Function));
    expect(questions.tags).toEqual(jasmine.any(Function));
    expect(questions.drop).toEqual(jasmine.any(Function));
  });
});
