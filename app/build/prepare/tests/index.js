fdescribe("prepare", function() {

  var prepare = require('../index');

  beforeEach(function(){
    this.entry = {
      path: '',
      size: 123,
      html: '',
      updated: 123,
      draft: true,
      metadata: {}
    };
  });


  it("returns an empty title, summary and teaser when the file is empty", function(){

    var entry = this.entry;

    entry.html = '<p>Hey there.</p>';
    entry.metadata = {
        title: ''
      };

    prepare(entry);

    expect(entry.title).toEqual('');
    expect(entry.summary).toEqual('Hey there.');
  });
});