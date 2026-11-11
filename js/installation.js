(function () {
  'use strict';

  // Run only on installation page
  if (!document.body.classList.contains('installation')) return;

  var H = window.Helpers;

  var container = document.querySelector('.installationselection');
  if (!container) return;
  var result = document.getElementById('result');
  var templates = document.querySelector('.instruction-collection');
  var instructions = document.querySelectorAll('.installation-instructions');
  var wrap = result ? Array.from(result.children).find(function (el) { return el.classList.contains('instruction-wrap'); }) : null;
  var docsLink = result ? result.querySelector('.more .docs-link') : null;
  var foldCatalog = container.querySelector('.selection-foldout[data-foldout="catalog"]');
  var rgCatalog = container.querySelector('.selection-options[data-role="catalog"]');

  var state = {
    catalog: null
  };

  function options() {
    return rgCatalog ? Array.from(rgCatalog.querySelectorAll('.option')) : [];
  }

  function readURL() {
    try {
      var params = new URLSearchParams(window.location.search);
      state.catalog = sanitizeParam(params.get('catalog'));
    } catch (e) {}
  }

  function writeURL() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (state.catalog) params.set('catalog', state.catalog);
      else params.delete('catalog');
      var newQuery = params.toString();
      var newUrl = window.location.pathname + (newQuery ? '?' + newQuery : '') + window.location.hash;
      var prevQuery = window.location.search.replace(/^\?/, '');
      if (prevQuery !== newQuery) {
        window.history.replaceState({}, '', newUrl);
      }
    } catch (e) {}
  }

  function sanitizeParam(val) {
    if (val == null) return null;
    val = String(val).trim().toLowerCase();
    if (!val) return null;
    return val;
  }

  function optionValue(opt) {
    return opt.getAttribute('data-value') || '';
  }

  function findOption(value) {
    return options().find(function (opt) {
      return optionValue(opt) === String(value);
    }) || null;
  }

  function normalizeState() {
    if (state.catalog && findOption(state.catalog)) return;
    var active = options().find(function (opt) { return opt.classList.contains('active'); }) || options()[0];
    state.catalog = (active && optionValue(active)) || null;
  }

  function selectOption(value) {
    var opt = findOption(value);
    if (!opt) return;

    options().forEach(function (other) {
      other.classList.remove('active');
      other.setAttribute('aria-checked', 'false');
      other.setAttribute('tabindex', '-1');
    });
    opt.classList.add('active');
    opt.setAttribute('aria-checked', 'true');
    opt.setAttribute('tabindex', '0');

    state.catalog = value;
  }

  function setFoldoutOpen(foldout, open, animate) {
    if (!foldout) return;
    var content = Array.from(foldout.children).find(function (el) { return el.classList.contains('selection-content'); });
    var changed = foldout.classList.contains('open') !== open;
    foldout.querySelectorAll('.selection-head button').forEach(function (button) {
      button.setAttribute('aria-expanded', String(open));
    });
    foldout.classList.toggle('open', open);
    if (!content) return;
    H.stop(content);
    if (open) {
      if (animate && changed) {
        H.hide(content);
        H.slideDown(content, 150);
      } else {
        H.show(content);
      }
    } else if (animate && changed) {
      content.style.display = 'block';
      H.slideUp(content, 150);
    } else {
      H.hide(content);
    }
  }

  function updateHeading() {
    if (!foldCatalog) return;
    var activeLabel = rgCatalog ? rgCatalog.querySelector('.option.active .label') : null;
    var label = activeLabel ? activeLabel.textContent.trim() : '';
    foldCatalog.querySelectorAll('.selection-head .selected').forEach(function (el) {
      el.textContent = label ? ' ' + label : '';
    });
  }

  function disableDocsLink() {
    if (!docsLink) return;
    docsLink.removeAttribute('href');
    H.hide(docsLink);
    docsLink.setAttribute('aria-disabled', 'true');
    docsLink.setAttribute('tabindex', '-1');
  }

  function render() {
    var tpl = templates ? templates.querySelector('[data-catalog="' + cssEscape(state.catalog) + '"]') : null;

    if (!tpl) {
      if (wrap) wrap.innerHTML = '';
      disableDocsLink();
      instructions.forEach(function (el) { H.hide(el); });
      return;
    }

    if (wrap) wrap.innerHTML = tpl.innerHTML;

    var docs = String(tpl.getAttribute('data-docs') || '').trim();
    if (docs && docsLink) {
      docsLink.setAttribute('href', docs);
      H.show(docsLink);
      docsLink.removeAttribute('aria-disabled');
      docsLink.setAttribute('tabindex', '0');
    } else {
      disableDocsLink();
    }

    instructions.forEach(function (el) { H.show(el); });
  }

  function onOptionActivate(opt) {
    var value = optionValue(opt);
    if (!value) return;

    selectOption(value);
    opt.focus();

    writeURL();
    render();
    updateHeading();
  }

  function wire() {
    if (rgCatalog) rgCatalog.setAttribute('role', 'radiogroup');
    options().forEach(function (opt) { opt.setAttribute('role', 'radio'); });

    container.addEventListener('click', function (e) {
      var opt = e.target.closest('.selection-options .option');
      if (opt && container.contains(opt)) {
        e.stopPropagation();
        onOptionActivate(opt);
        return;
      }
      var head = e.target.closest('.selection-head');
      if (head && container.contains(head)) {
        e.stopPropagation();
        var fold = head.closest('.selection-foldout');
        if (fold) setFoldoutOpen(fold, !fold.classList.contains('open'), true);
        return;
      }
      var content = e.target.closest('.selection-content');
      if (content && container.contains(content)) {
        e.stopPropagation();
        return;
      }
      var foldout = e.target.closest('.selection-foldout');
      if (foldout && container.contains(foldout) && !foldout.classList.contains('open')) {
        setFoldoutOpen(foldout, true, true);
      }
    });

    container.addEventListener('keydown', function (e) {
      var opt = e.target.closest('.selection-options .option');
      if (!opt || !container.contains(opt)) return;
      var key = e.key || e.keyCode;

      if (key === 'Enter' || key === ' ' || key === 13 || key === 32) {
        e.preventDefault();
        onOptionActivate(opt);
        return;
      }

      if (key === 'ArrowRight' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowUp') {
        e.preventDefault();
        var opts = Array.from(opt.closest('.selection-options').querySelectorAll('.option'));
        var idx = opts.indexOf(opt);
        if (idx < 0) return;
        var dir = (key === 'ArrowRight' || key === 'ArrowDown') ? 1 : -1;
        onOptionActivate(opts[(idx + dir + opts.length) % opts.length]);
      }
    });
  }

  function cssEscape(str) {
    var s = String(str);
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return s.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  // Init
  readURL();
  normalizeState();
  selectOption(state.catalog);
  writeURL();
  instructions.forEach(function (el) { H.hide(el); });
  render();
  updateHeading();
  setFoldoutOpen(foldCatalog, foldCatalog ? foldCatalog.classList.contains('open') : false, false);
  wire();
})();
