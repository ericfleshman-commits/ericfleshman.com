/* Vertical snap deck: native scroll, snap between full-screen panels.
   Only job left here is nav/CTA jumps to panels. */
(function () {
  "use strict";
  var track = document.querySelector(".htrack");
  if (!track) return;
  var panels = Array.prototype.slice.call(track.children);
  if (!panels.length) return;

  var jumpLinks = Array.prototype.slice.call(document.querySelectorAll("a[data-panel]"));
  jumpLinks.forEach(function (a) {
    a.addEventListener("click", function (e) {
      var i = parseInt(a.getAttribute("data-panel"), 10);
      if (isNaN(i) || i < 0 || i >= panels.length) return;
      e.preventDefault();
      panels[i].scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
