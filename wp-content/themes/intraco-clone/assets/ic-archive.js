/* Local replacement for JetSmartFilters on /products/: client-side filter + infinite scroll (10 per page). */
(function () {
  'use strict';
  var PER = 10;
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () {
    var host = document.querySelector('#search-result .jet-listing-grid__items');
    if (!host) return;
    var cards = Array.prototype.slice.call(host.querySelectorAll('.jet-listing-grid__item'));
    var notFound = document.createElement('div');
    notFound.className = 'jet-listing-not-found jet-listing-grid__items';
    notFound.style.display = 'none';
    notFound.textContent = (window.IC_ARCHIVE_I18N && window.IC_ARCHIVE_I18N.notFound) || 'No matching products found. Please try adjusting your search / filter.';
    host.parentNode.appendChild(notFound);
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'height:1px;width:100%';
    host.parentNode.appendChild(sentinel);

    var checks = Array.prototype.slice.call(document.querySelectorAll('.jet-checkboxes-list__input'));
    var inputs = {};
    Array.prototype.forEach.call(document.querySelectorAll('.jet-search-filter__input'), function (i) { inputs[i.name] = i; });
    var matched = [], shown = 0;

    function csv(s) { return (s || '').split(',').filter(Boolean); }
    function selected(name) { var o = []; checks.forEach(function (c) { if (c.name === name && c.checked && o.indexOf(c.value) < 0) o.push(c.value); }); return o; }
    function matches(c, ind, cat, w, l, h) {
      if (ind.length && !csv(c.getAttribute('data-ind')).some(function (x) { return ind.indexOf(x) > -1; })) return false;
      if (cat.length && !csv(c.getAttribute('data-cat')).some(function (x) { return cat.indexOf(x) > -1; })) return false;
      if (w && (c.getAttribute('data-w') || '').indexOf(w) < 0) return false;
      if (l && (c.getAttribute('data-l') || '').indexOf(l) < 0) return false;
      if (h && (c.getAttribute('data-h') || '').indexOf(h) < 0) return false;
      return true;
    }
    function val(n) { var v = inputs[n] ? inputs[n].value.trim() : ''; return v.length >= 3 ? v : ''; }
    function showMore() {
      var next = matched.slice(shown, shown + PER);
      next.forEach(function (c) { c.style.display = ''; });
      shown += next.length;
    }
    function apply(keepUrl) {
      var ind = selected('industries'), cat = selected('product-category');
      var w = val('product_width_alt'), l = val('product_length_alt'), h = val('product_height_alt');
      matched = cards.filter(function (c) { return matches(c, ind, cat, w, l, h); });
      cards.forEach(function (c) { c.style.display = 'none'; });
      shown = 0; showMore();
      notFound.style.display = matched.length ? 'none' : '';
      if (!keepUrl && window.history && history.replaceState) {
        var q = [];
        var tax = [];
        if (ind.length) tax.push('industries:' + ind.join(','));
        if (cat.length) tax.push('product-category:' + cat.join(','));
        if (tax.length) { q.push('jsf=jet-engine'); q.push('tax=' + tax.join(';')); }
        history.replaceState(null, '', location.pathname + (q.length ? '?' + q.join('&') : '') + location.hash);
      }
    }
    // initial state from ?jsf=jet-engine&tax=product-category:19;industries:15,14
    try {
      var sp = new URLSearchParams(location.search);
      (sp.get('tax') || '').split(';').forEach(function (part) {
        var kv = part.split(':'); if (kv.length < 2) return;
        var vals = kv[1].split(',');
        checks.forEach(function (c) { if (c.name === kv[0] && vals.indexOf(c.value) > -1) c.checked = true; });
      });
    } catch (e) {}
    checks.forEach(function (c) { c.addEventListener('change', function () { checks.forEach(function (o) { if (o !== c && o.name === c.name && o.value === c.value) o.checked = c.checked; }); apply(false); }); });
    Object.keys(inputs).forEach(function (n) {
      inputs[n].addEventListener('input', function () { apply(true); });
      var clr = inputs[n].parentNode.querySelector('.jet-search-filter__input-clear');
      if (clr) clr.addEventListener('click', function () { inputs[n].value = ''; apply(true); });
    });
    apply(true);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && shown < matched.length) { showMore(); }
      }, { rootMargin: '400px' }).observe(sentinel);
    } else {
      window.addEventListener('scroll', function () {
        if (shown < matched.length && sentinel.getBoundingClientRect().top < innerHeight + 400) showMore();
      });
    }
    // after showing more, if sentinel is still visible the observer will not re-fire: poll lightly
    setInterval(function () {
      if (shown < matched.length && sentinel.getBoundingClientRect().top < innerHeight + 400) showMore();
    }, 400);
  });
})();
