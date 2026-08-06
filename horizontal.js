/* Horizontal deck driver: vertical scroll maps 1:1 to left-right travel.
   Each panel is one screen; the sticky viewport translates the track. */
(function () {
  "use strict";
  var track = document.querySelector(".htrack");
  var nav = document.querySelector("nav");
  if (!track || !nav) return;

  var panelCount = track.children.length;
  var navH = 0;

  function measure() {
    navH = nav ? nav.offsetHeight : 0;
  }

  function update() {
    var vh = window.innerHeight;
    var vw = window.innerWidth;
    var raw = Math.max(0, window.scrollY - navH);
    var maxScroll = (panelCount - 1) * vh;
    var p = maxScroll > 0 ? Math.min(raw / maxScroll, 1) : 0;
    var x = p * (panelCount - 1) * vw;
    track.style.transform = "translate3d(" + -x + "px,0,0)";
  }

  measure();
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", function () {
    measure();
    update();
  });

  /* Nav and CTA links: jump to a panel by index */
  var jumpLinks = Array.prototype.slice.call(document.querySelectorAll("a[data-panel]"));
  jumpLinks.forEach(function (a) {
    a.addEventListener("click", function (e) {
      var i = parseInt(a.getAttribute("data-panel"), 10);
      if (isNaN(i) || i < 0 || i >= panelCount) return;
      e.preventDefault();
      window.scrollTo({ top: navH + i * window.innerHeight, behavior: "smooth" });
    });
  });

  /* Trackpad horizontal swipe: translate into vertical scroll */
  window.addEventListener(
    "wheel",
    function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        window.scrollBy({ top: e.deltaX, behavior: "auto" });
      }
    },
    { passive: false }
  );
})();
