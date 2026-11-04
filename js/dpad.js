/* Spatial arrow-key navigation for a remote control and a keyboard. */
(function (global) {
  function isTyping(el) {
    if (!el) return false;
    var tag = el.tagName;
    if (tag === "INPUT" && el.type === "range") return false;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  function visible(el) {
    if (!el || el.disabled) return false;
    if (el.closest("[hidden]")) return false;
    var style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return el.getClientRects().length > 0;
  }

  function focusables(root) {
    var scope = root || document.body;
    return Array.prototype.filter.call(
      scope.querySelectorAll("button, a[href], input, select, textarea, [tabindex='0']"),
      visible
    );
  }

  function center(el) {
    var rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect: rect };
  }

  function move(direction, root) {
    var list = focusables(root);
    if (!list.length) return;
    var current = document.activeElement;
    if (list.indexOf(current) === -1) {
      list[0].focus();
      return;
    }
    var from = center(current);
    function pick(strict) {
      var best = null;
      var bestScore = Infinity;
      list.forEach(function (el) {
        if (el === current) return;
        var to = center(el);
        var dx = to.x - from.x;
        var dy = to.y - from.y;
        if (direction === "left" && dx >= -4) return;
        if (direction === "right" && dx <= 4) return;
        if (direction === "up" && dy >= -4) return;
        if (direction === "down" && dy <= 4) return;
        var primary = direction === "left" || direction === "right" ? Math.abs(dx) : Math.abs(dy);
        var secondary = direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);
        if (strict && secondary > primary * 2.4 && secondary > 48) return;
        var score = primary + secondary * 1.8;
        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      });
      return best;
    }
    var best = pick(true) || pick(false);
    if (best) {
      best.focus();
      best.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }

  function install(options) {
    var getRoot = (options && options.root) || function () { return document.body; };
    document.addEventListener("keydown", function (event) {
      var map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
      var direction = map[event.key];
      if (!direction) return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      move(direction, getRoot());
    });
  }

  global.Dpad = { install: install, focusables: focusables, move: move, isTyping: isTyping };
})(window);
