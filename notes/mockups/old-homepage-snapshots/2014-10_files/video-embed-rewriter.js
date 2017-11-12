var _wmVideos_ = new function() {

  var inited = false;

  this.init = function(prefix, id_url) {
    if (inited) {
      return;
    }

    inited = true;

    var initFun = function() {
      if (!id_url) {
        loadYTWatch(prefix);
      } else {
        doEmbed(prefix, id_url);
      }
    }

    if (window.addEventListener) {
      window.addEventListener('load', initFun, false);
    } else if (window.attachEvent) {
      window.attachEvent('onload', initFun);
    }
  }

//  var initYTVideoEmbedRewriter = function(prefix) {
//    var initFun = function() {
//      loadYTWatch(prefix);
//    }
//
//    if (window.addEventListener) {
//      window.addEventListener('load', initFun, false);
//    } else if (window.attachEvent) {
//      window.attachEvent('onload', initFun);
//    }
//  }

  var loadYTWatch = function(prefix, videoid) {
    var http = new XMLHttpRequest();

    var EMBED = "/embed/";
    var idindex = document.location.href.indexOf(EMBED);

    if (idindex < 0) {
      return;
    }

    videoid = document.location.href.substr(idindex + EMBED.length);

    http.open('GET', prefix + "http://youtube.com/watch?v=" + videoid);
    http.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    
    http.onreadystatechange = function() {
      if (http.readyState === 4) {
        if (http.status == 200) {
          var groups = http.responseText.match(/initYTVideo\(\'([^']+)/);
          if (!groups || groups.length < 1) {
            return;
          }
          var id = groups[1];
          doEmbed(prefix, id, videoid);
        }
      }
    };
    
    http.send();
  }

  var doEmbed = function(prefix, id, videoid) {
    var videoUrl = "http://wayback-fakeurl.archive.org/yt/" + id;

    if (!videoid) {
      var groups = document.location.href.match(/watch.*[?&]v=([^&]+)/);
      if (groups && groups.length > 1) {
        videoid = groups[1];
      }
    }

    var imgUrl = null;

    if (videoid) {
      imgUrl = "http://wayback-fakeurl.archive.org/yt/img/" + videoid;
    }

    findReplaceVideoPlayer(prefix + "2oe_/" + videoUrl, prefix + "9930im_/"
        + imgUrl);
  }

  var findReplaceVideoPlayer = function(videoUrl, imgUrl) {

    // First try embeds, then objects
    var elems = document.getElementsByTagName("embed");

    if (elems && elems.length > 0) {

      var index = 0;
      if ((elems.length > 1) && (elems[0].src.indexOf("version") > 0)) {
        index = 1;
      }

      writeWatchPlayer(elems[index], videoUrl, imgUrl);
      return;
    }

    elems = document.getElementsByTagName("object");

    if (elems && elems.length > 0) {
      writeWatchPlayer(elems[0], videoUrl, imgUrl);
      return;
    }
  }

  var writeWatchPlayer = function(player, fullWaybackUrl, fullImgUrl) {

    var width = "100%";
    var height = "100%";

    if (player.tagName != "div") {
      if (player.clientHeight) {
        height = player.clientHeight;
      }

      if (player.clientWidth) {
        width = player.clientWidth;
      }

      player = player.parentNode;

      if (!player.id) {
        player.id = "_wm_video_embed_" + new Date().getTime();
      }
    }

    var playerId = player.id;

    if (player.clientHeight) {
      height = player.clientHeight;
    }

    if (player.clientWidth) {
      width = player.clientWidth;
    }

    var doSetup = function(theType, autostart, onErrFallback) {
      if (jwplayer) {
        jwplayer.key = "sZbikYlI/xtW0U/3Tw1DOdjC1EahhtUCJF5KggVdqDY=";
      }
      
      jwplayer(playerId).setup({
        'height' : height,
        'width' : width,
        'autostart' : autostart,
        'image' : fullImgUrl,

        playlist : [ {
          image : fullImgUrl,
          sources : [ {
            'file' : fullWaybackUrl,
            type : theType
          }, ]
        } ],

        events : {
          onError : onErrFallback
        }
      });
    }

    var initByType = function(vidType) {

      if (vidType == null) {
        player.innerHTML = "Sorry, the Wayback Machine does not have this video archived.";
        player.style.paddingLeft = "0px";
        player.style.paddingTop = "24px";
      } else if (vidType.indexOf('webm') >= 0) {
        doSetup('webm', false);
      } else if (vidType.indexOf('flv') >= 0) {
        doSetup('flv', false);
      } else {
        doSetup('webm', false, function() {
          doSetup('flv', true);
        });
      }
    }

    // Ajax to check type
    var http = new XMLHttpRequest();
    http.onreadystatechange = function() {
      if (http.readyState === 4) {
        var theType = null;

        if (http.status == 200) {
          theType = http.getResponseHeader("Content-Type");
        }

        initByType(theType);
      }
    }

    http.open('HEAD', fullWaybackUrl);
    http.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    http.send();
  }
};
