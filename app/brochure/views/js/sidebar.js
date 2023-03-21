var sidebarLinks = document.querySelectorAll('.sidebar a');
   
   sidebarLinks.forEach(function(targetNode){
     var ignore = [
       targetNode, 
       targetNode.parentNode.parentNode.previousElementSibling,
       targetNode.parentNode.parentNode.parentNode.parentNode.previousElementSibling]; 
     
     targetNode.addEventListener('click', function (e) {
       sidebarLinks.forEach(function(node){
         if (ignore.indexOf(node) > -1) return;
         node.setAttribute('data-open', '');
       });
     });
   
     targetNode.addEventListener('mousedown', function (e) {
       sidebarLinks.forEach(function(node){
         node.classList.remove('selected');
       });
     });
   });
   
   
     (function() {
     scrollTo();
   })();
   
   // Smooth scrolling
   function scrollTo() {
     const links = document.querySelectorAll('.scroll');
     links.forEach(each => (each.onclick = scrollAnchors));
   }
   
   function scrollAnchors(e, respond = null) {
     const distanceToTop = el => Math.floor(el.getBoundingClientRect().top);
     e.preventDefault();
     var targetID = (respond) ? respond.getAttribute('href') : this.getAttribute('href');
     const targetAnchor = document.querySelector(targetID);
     if (!targetAnchor) return;
     const originalTop = distanceToTop(targetAnchor);
     window.scrollBy({ top: originalTop, left: 0, behavior: 'smooth' });
     const checkIfDone = setInterval(function() {
       const atBottom = window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 2;
       if (distanceToTop(targetAnchor) === 0 || atBottom) {
         targetAnchor.tabIndex = '-1';
         targetAnchor.focus();
         window.history.pushState('', '', targetID);
         clearInterval(checkIfDone);
       }
     }, 100);
   }
   
   
   
   // Highlight active section
   
     const links = [];
     const offsets = [];
     const titles = [];
   
     document.querySelectorAll('.scroll').forEach(function(link){
       var id = link.href.slice(link.href.indexOf('#') + 1);
       var title = document.getElementById(id);
       var offset = window.pageYOffset + title.getBoundingClientRect().top;
       titles.push(title);
       offsets.push(offset);
       links.push(link);
     });
   
     function highlightActiveSection () {
       var offset = window.pageYOffset;
       var minDiff;
       var minDiffI;
       offsets.forEach(function(titleOffset, i){
         var diff = Math.abs(titleOffset - offset);
         if (minDiff === undefined) {
           minDiff = diff;
           minDiffI = i;
         } else if (titleOffset > offset && diff < minDiff) {
           minDiff = diff;
           minDiffI = i;
         } else {
           return false;
         }
       });
   
       links.forEach(function(link, i){
         if (i === minDiffI) {
           link.parentNode.classList.add("selected");
         } else {
           link.parentNode.classList.remove("selected");
         }
       });
     }
   
     window.onscroll = highlightActiveSection;
   
   