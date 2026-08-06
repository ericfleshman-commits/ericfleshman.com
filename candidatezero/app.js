(function () {
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var links = Array.prototype.slice.call(document.querySelectorAll('nav.toc a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function showAll() {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  if (!('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showAll();
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  var tocObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var i = sections.indexOf(entry.target);
      if (i < 0 || !entry.isIntersecting) return;
      links.forEach(function (l) { l.classList.remove('active'); });
      links[i].classList.add('active');
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(function (s) { if (s) tocObserver.observe(s); });
})();

(function () {
  var car = document.querySelector('.award-carousel');
  if (!car) return;
  var track = car.querySelector('.ac-track');
  var slides = Array.prototype.slice.call(car.querySelectorAll('.ac-slide'));
  var dots = Array.prototype.slice.call(car.querySelectorAll('.ac-dot'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function current() {
    return Math.round(track.scrollLeft / track.clientWidth);
  }
  function go(i) {
    var n = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: n * track.clientWidth + n * 16, behavior: reduced ? 'auto' : 'smooth' });
  }
  function sync() {
    var i = current();
    dots.forEach(function (d, j) { d.classList.toggle('active', j === i); });
  }

  car.addEventListener('click', function (e) {
    var btn = e.target.closest('.ac-btn');
    var dot = e.target.closest('.ac-dot');
    if (btn) go(current() + parseInt(btn.getAttribute('data-dir'), 10));
    if (dot) go(parseInt(dot.getAttribute('data-go'), 10));
  });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
  });
  var t;
  track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 80); });
})();
