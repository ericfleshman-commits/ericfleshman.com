/* Shared Builds menu behavior: click to open, click-away or Escape to close. */
(function () {
  var menus = document.querySelectorAll('.builds-menu');
  Array.prototype.forEach.call(menus, function (menu) {
    var btn = menu.querySelector('.builds-trigger');
    var panel = menu.querySelector('.builds-panel');
    if (!btn || !panel) return;

    function close() {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
    function open() {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (panel.hidden) { open(); } else { close(); }
    });

    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target)) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') close();
    });
  });
})();
