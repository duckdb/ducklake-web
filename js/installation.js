(function ($) {
  'use strict';

  $(function () {
    // Run only on installation page
    if (!$('body').hasClass('installation')) return;

    var $container = $('.installationselection');
    var $result = $('#result');
    var $templates = $('.instruction-collection');
    var $inst = $('.installation-instructions');
    var $wrap = $result.children('.instruction-wrap');
    var $docsLink = $result.find('.more .docs-link');
    var $foldCatalog = $container.find('.selection-foldout[data-foldout="catalog"]');
    var $rgCatalog = $container.find('.selection-options[data-role="catalog"]');

    var state = {
      catalog: null
    };

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

    function findOption(value) {
      return $rgCatalog.find('.option').filter(function () {
        return String($(this).data('value')) === String(value);
      }).first();
    }

    function normalizeState() {
      if (state.catalog && findOption(state.catalog).length) return;
      var $active = $rgCatalog.find('.option.active').first();
      if (!$active.length) $active = $rgCatalog.find('.option').first();
      state.catalog = String($active.data('value') || '') || null;
    }

    function selectOption(value) {
      var $opt = findOption(value);
      if (!$opt.length) return;

      $rgCatalog.find('.option')
        .removeClass('active')
        .attr('aria-checked', 'false')
        .attr('tabindex', '-1');
      $opt
        .addClass('active')
        .attr('aria-checked', 'true')
        .attr('tabindex', '0');

      state.catalog = value;
    }

    function setFoldoutOpen($foldout, open, animate) {
      var $content = $foldout.children('.selection-content');
      $foldout.find('.selection-head button').attr('aria-expanded', String(open));
      if (open) {
        $foldout.addClass('open');
        if (animate) $content.stop(true, true).slideDown(150); else $content.show();
      } else {
        $foldout.removeClass('open');
        if (animate) $content.stop(true, true).slideUp(150); else $content.hide();
      }
    }

    function updateHeading() {
      var label = $.trim($rgCatalog.find('.option.active .label').first().text());
      $foldCatalog.find('.selection-head .selected').text(label ? ' ' + label : '');
    }

    function render() {
      var $tpl = $templates.find('[data-catalog="' + cssEscape(state.catalog) + '"]').first();

      if (!$tpl.length) {
        $wrap.empty();
        $docsLink.removeAttr('href').hide().attr('aria-disabled', 'true').attr('tabindex', '-1');
        $inst.hide();
        return;
      }

      $wrap.html($tpl.html());

      var docs = String($tpl.attr('data-docs') || '').trim();
      if (docs) {
        $docsLink.attr('href', docs).show().removeAttr('aria-disabled').attr('tabindex', '0');
      } else {
        $docsLink.removeAttr('href').hide().attr('aria-disabled', 'true').attr('tabindex', '-1');
      }

      $inst.show();
    }

    function onOptionActivate($opt) {
      var value = String($opt.data('value') || '');
      if (!value) return;

      selectOption(value);
      $opt.focus();

      writeURL();
      render();
      updateHeading();
    }

    function wire() {
      $rgCatalog.attr('role', 'radiogroup');
      $rgCatalog.find('.option').attr('role', 'radio');

      $container.on('click', '.selection-options .option', function (e) {
        e.stopPropagation();
        onOptionActivate($(this));
      });

      $container.on('click', '.selection-content', function (e) {
        e.stopPropagation();
      });

      $container.on('click', '.selection-foldout', function () {
        var $fold = $(this);
        if (!$fold.hasClass('open')) {
          setFoldoutOpen($fold, true, true);
        }
      });

      $container.on('click', '.selection-head', function (e) {
        e.stopPropagation();
        var $fold = $(this).closest('.selection-foldout');
        setFoldoutOpen($fold, !$fold.hasClass('open'), true);
      });

      $container.on('keydown', '.selection-options .option', function (e) {
        var key = e.key || e.keyCode;

        if (key === 'Enter' || key === ' ' || key === 13 || key === 32) {
          e.preventDefault();
          onOptionActivate($(this));
          return;
        }

        if (key === 'ArrowRight' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowUp') {
          e.preventDefault();
          var $opts = $(this).closest('.selection-options').find('.option');
          var idx = $opts.index(this);
          if (idx < 0) return;
          var dir = (key === 'ArrowRight' || key === 'ArrowDown') ? 1 : -1;
          onOptionActivate($opts.eq((idx + dir + $opts.length) % $opts.length));
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
    $inst.hide();
    render();
    updateHeading();
    setFoldoutOpen($foldCatalog, $foldCatalog.hasClass('open'), false);
    wire();
  });
})(jQuery);
