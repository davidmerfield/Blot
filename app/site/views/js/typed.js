var demo = function () {
   
  var element = document.getElementById('desmo');

  function between (x, y) {
    return Math.floor(Math.random()*(y-x)) + x;
  }

  function delay (length) {

    var min, max;

    switch (length) {
      case 'short':
        min = 30;
        max = 120;
        break;
      case 'medium':
        min = 40;
        max = 150;
        break;
      case 'longish':
        min = 100;
        max = 200;
        break;
      case 'long':
        min = 200;
        max = 400;
        break;
      default:
        min = 40;
        max = 100;
    }

    return between(min, max);

  }

  function type (text, callback) {
      
    if (!text.length) return callback();

    var new_character = text[0];
    var remaining_text = text.slice(1);
    var delay_length;

    switch (new_character) {
      case ' ':
        delay_length = 'medium';
        break;
      case '.':
        delay_length = 'long';
        break;
      default:
        delay_length = 'short';
    }

    setTimeout(function(){

      element.innerHTML += new_character;
       
      type(remaining_text, callback);

    }, delay(delay_length)); 
   }

   return function () {

    type('There\'s no interface. Just files and folders. This means you can use your favorite text editor to write your blog.', function(){

    });
   }()
};