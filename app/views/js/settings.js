$(document).ready(function () {
  $("#redirects").on("click", ".removeLink", function (e) {
    $(this).parent().remove();
    e.preventDefault();
    return false;
  });

  $("#addRedirect").click(function (e) {
    var index = $("#redirects section").length;

    var html =
      "<section>" +
      '<span class="handle">&#9776;</span>' +
      "<label>" +
      '<input placeholder="from" type="text" name="redirects.' +
      index +
      '.from" value=""/>' +
      "</label>" +
      "<label>" +
      '<input placeholder="to" type="text" name="redirects.' +
      index +
      '.to" value=""/>' +
      "</label>" +
      '<a class="button small secondary removeLink" class="right">Delete</a>' +
      '<div class="clear"></div>' +
      "</section>";

    $("#redirects").append(html);

    e.preventDefault();
    return false;
  });

  $("#menu").on("click", ".removeLink", function (e) {
    $(this).parent().remove();
    e.preventDefault();
    return false;
  });

  $('input[name="roundAvatar"]').change(function () {
    if ($(this)[0].checked) {
      $("#avatar img").addClass("rounded");
    } else {
      $("#avatar img").removeClass("rounded");
    }
  });

  $("#addLink").click(function (e) {
    var index = $("#menu section").length;

    var linkID = new Date().getTime(),
      html =
        '<section id="link_' +
        linkID +
        '">' +
        '<span class="handle">&#9776;</span>' +
        '<input type="hidden" name="menu.' +
        index +
        '.id" value="' +
        linkID +
        '"/>' +
        "<label>" +
        '<input type="text" name="menu.' +
        index +
        '.label" value="" placeholder="Label" />' +
        "</label>" +
        "<label>" +
        '<input type="text" name="menu.' +
        index +
        '.url" value="http://" placeholder="URL"/>' +
        "</label>" +
        '<a class="button small secondary removeLink">Delete</a>' +
        '<span class="clear"></span>' +
        "</section>";

    $("#menu").append(html);

    $('[name="title_' + linkID + '"]').focus();

    e.preventDefault();
    return false;
  });

  if ($(".sortable")[0]) {
    Sortable.create($(".sortable")[0], {
      handle: ".handle",
      ghostClass: "sortable-ghost",
      onUpdate: function () {
        $(".sortable")
          .find("section")
          .each(function () {
            var index = $(this).index();

            $(this)
              .find("input")
              .each(function () {
                var name = $(this).attr("name");
                var newName =
                  name.slice(0, name.indexOf(".") + 1) +
                  index +
                  name.slice(name.lastIndexOf("."));

                $(this).attr("name", newName);

                console.log(name + " > " + newName);
              });

            console.log("");
          });
      },
    });
  }

  
});
