// Import necessary dependencies and the module to test
var renderModule = require("../middleware");
var Template = require("models/template");
var ERROR = require("../error");
var loadView = require("../load");
var renderLocals = require("../locals");
var finalRender = require("../main");
var retrieve = require("../retrieve");

// Mock other dependencies
var ensure = require("helper/ensure");
var extend = require("helper/extend");
var callOnce = require("helper/callOnce");
var config = require("config");
var CleanCSS = require("clean-css");

describe("renderModule", function() {
  var req, res, next, callback;

  beforeEach(function() {
    // Setup the request, response, and callback objects
    req = {
      query: {},
      log: () => {},
      template: {
        id: "templateID",
        locals: {}
      },
      blog: {
        id: "blogID",
        locals: {}
      },
      headers: {}
    };
    res = {
      locals: {
        partials: {}
      },
      set: jasmine.createSpy("set"),
      json: jasmine.createSpy("json"),
      header: jasmine.createSpy("header"),
      send: jasmine.createSpy("send")
    };
    next = jasmine.createSpy("next");
    callback = jasmine.createSpy("callback");

    // Mock external functions
    spyOn(Template, 'getFullView').and.callFake((blogID, templateID, name, cb) => cb(null, [{}, {}, {}, "text/html", "view content"]));
    spyOn(loadView, 'call').and.callFake((req, res, cb) => cb(null, req, res));
    spyOn(renderLocals, 'call').and.callFake((req, res, cb) => cb(null, req, res));
    spyOn(finalRender, 'call').and.returnValue("rendered content");
    spyOn(retrieve, 'call').and.callFake((req, locs, cb) => cb(null, {}));
    spyOn(ensure, 'call').and.callThrough();
    spyOn(extend, 'call').and.callThrough();
    spyOn(callOnce, 'call').and.callThrough();
    spyOn(CleanCSS.prototype, 'minify').and.returnValue({ styles: "minified css" });
  });



  it("should handle errors in retrieving the full view", function() {
    Template.getFullView.and.callFake((blogID, templateID, name, cb) => cb(new Error("Error fetching view"), null));
    renderModule(req, res, next);
    res.renderView("viewName", next, callback);

    expect(next).toHaveBeenCalledWith(jasmine.any(Error));
  });

  it("should handle non-existing views", function() {
    Template.getFullView.and.callFake((blogID, templateID, name, cb) => cb(null, null));
    renderModule(req, res, next);
    res.renderView("viewName", next, callback);

    expect(next).toHaveBeenCalledWith(jasmine.objectContaining({ code: "NO_VIEW" }));
  });



});