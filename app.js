
/* Count-up on the big numbers, once, when they scroll into view. */
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;
  var nums = document.querySelectorAll(".stat-num");
  function animate(el) {
    var raw = el.textContent;
    var m = raw.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)([\s\S]*)$/);
    if (!m) return;
    var prefix = m[1];
    var target = parseFloat(m[2]);
    var suffix = m[3];
    var decimals = (m[2].split(".")[1] || "").length;
    var start = null;
    var dur = 900;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) { requestAnimationFrame(frame); } else { el.textContent = raw; }
    }
    requestAnimationFrame(frame);
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        obs.unobserve(entry.target);
        animate(entry.target);
      }
    });
  }, { threshold: 0.4 });
  nums.forEach(function (el) { obs.observe(el); });
})();
