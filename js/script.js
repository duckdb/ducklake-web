function docBannerHeight() {
	var banner = document.querySelector('.banner.docversion');
	return banner ? banner.offsetHeight : 0;
}

$(document).ready(function(){
	
	if (window.location.hash) {
		var hash = window.location.hash;
		if ($(hash).length) {
			$('html, body').animate({
				scrollTop: $(hash).offset().top - 90 - docBannerHeight()
			}, 300, 'swing');
			if( $('.frequentlyaskedquestions').length ){
				$('h3'+hash).parent('.qa-wrap').addClass('open');
				$('h3'+hash).parent('.qa-wrap').find('.answer').slideToggle(300);
			}
		}
	}
	
	
	
	/** DARK MODE SWITCH */
	var isDark = document.documentElement.classList.contains('darkmode');
	$('.mode').attr('data-mode', isDark ? 'light' : 'dark');

	setTimeout(() => {
		document.documentElement.classList.remove('disable-transitions');
	}, 300);
	
	$('.mode').on('click', function() {
		var isDark = $(this).attr('data-mode') === 'dark';
		$('html').toggleClass('darkmode', isDark);
		$(this).attr('data-mode', isDark ? 'light' : 'dark');
		localStorage.setItem('mode', isDark ? 'dark' : 'light');
		document.documentElement.classList.add('disable-transitions');
		setTimeout(() => {
			document.documentElement.classList.remove('disable-transitions');
		}, 300);
	});

	
	
	// Simple detect OS 
	var OSName="Unknown OS";
	var OSdatid="Unknown OS";
	if (navigator.appVersion.indexOf("Win")!=-1) { OSName="Windows"; OSdatid="win" };
	if (navigator.appVersion.indexOf("Mac")!=-1) { OSName="macOS"; OSdatid="macos" };
	if (navigator.appVersion.indexOf("X11")!=-1) { OSName="UNIX"; OSdatid="linux" };
	if (navigator.appVersion.indexOf("Linux")!=-1) { OSName="Linux"; OSdatid="linux"};
	$('.systemdetected').html('System detected: '+OSName);
	
	
	
	/** FILTER LINE  */
	if ($('.filterbar').length !== 0) {

		/* CUSTOM FITROWS FUNCTION FOR ISOTOPE TO GET EQUAL HEIGHT TILES */
		!function(t){"use strict";function i(t){var i=t.create("fitRows");return i.prototype._resetLayout=function(){if(this.x=0,this.y=0,this.maxY=0,this.row=0,this.rows=[],this._getMeasurement("gutter","outerWidth"),this.options.equalheight)for(var t=0;t<this.isotope.items.length;t++)this.isotope.items[t].css({height:"auto"})},i.prototype._getItemLayoutPosition=function(t){t.getSize();var i=this.gutter||0,s=t.size.outerWidth,o=Math.ceil(this.isotope.size.innerWidth+i);0!==this.x&&s+this.x+i>o&&(this.x=0,this.y=this.maxY+i),0===this.x&&0!==this.y&&this.row++;var e={x:this.x,y:this.y};return this.maxY=Math.max(this.maxY,this.y+t.size.outerHeight),this.x+=s+i,void 0===this.rows[this.row]?(this.rows[this.row]=[],this.rows[this.row].start=this.y,this.rows[this.row].end=this.maxY):this.rows[this.row].end=Math.max(this.rows[this.row].end,this.maxY),t.row=this.row,e},i.prototype._equalHeight=function(){for(var t=0;t<this.isotope.items.length;t++){var i=this.isotope.items[t].row,s=this.rows[i];if(s){var o=s.end-s.start;o-=this.isotope.items[t].size.borderTopWidth+this.isotope.items[t].size.borderBottomWidth,o-=this.isotope.items[t].size.marginTop+this.isotope.items[t].size.marginBottom,o-=this.gutter.height||0,!1==this.isotope.items[t].size.isBorderBox&&(o-=this.isotope.items[t].size.paddingTop+this.isotope.items[t].size.paddingBottom),this.isotope.items[t].size.height=o,this.isotope.items[t].css({height:o.toString()+"px"})}}},i.prototype._getContainerSize=function(){return this.options.equalheight&&this._equalHeight(),{height:this.maxY}},i}"function"==typeof define&&define.amd?define(["../layout-mode"],i):"object"==typeof exports?module.exports=i(require("../layout-mode")):i(t.Isotope.LayoutMode)}(window);

		var $grid = $('.newstiles').isotope({
			itemSelector: '.postpreview',
			layoutMode: 'fitRows',
			fitRows: {
				gutter: 32,
				equalheight: true
			}
		});

		var $heading = $('.pagetitle h1').first();
		var defaultHeading = $.trim($heading.text());
		var $search = $('#search-input');
		var $coreToggle = $('#core-toggle');
		var $empty = $('.filter-empty');
		var activeFilter = '*';

		function updateFilterHighlight($button) {
			var $highlight = $button.closest('.filtertags').find('.filter-highlight');
			if ($highlight.length && $button.is(':visible')) {
				$highlight.css({
					left: $button.position().left,
					width: $button.outerWidth()
				});
			}
		}

		function setActiveFilter(value) {
			activeFilter = value;
			$('.filterbar .filtertags').each(function() {
				var $buttons = $(this).find('.filter-btn').removeClass('active');
				var $match = $buttons.filter('[data-filter="' + value + '"]').addClass('active');
				updateFilterHighlight($match);
			});
			var heading = $('.filterbar .filter-btn.active').first().attr('data-heading');
			$heading.text(heading || defaultHeading);
		}

		function readFiltersFromURL() {
			var params = new URLSearchParams(window.location.search);
			var type = params.get('type');
			if (type && $('.filterbar .filter-btn[data-filter=".' + type + '"]').length) {
				setActiveFilter('.' + type);
			}
			if (params.get('q')) {
				$search.val(params.get('q'));
			}
			if (params.get('core') === '1') {
				$coreToggle.prop('checked', true);
			}
		}

		function writeFiltersToURL() {
			var params = new URLSearchParams();
			if (activeFilter !== '*') {
				params.set('type', activeFilter.replace(/^\./, ''));
			}
			if ($coreToggle.is(':checked')) {
				params.set('core', '1');
			}
			if ($search.val()) {
				params.set('q', $search.val());
			}
			history.replaceState(null, '', window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
		}

		function applyFilters() {
			var searchValue = $search.val().toLowerCase().trim();
			var coreOnly = $coreToggle.is(':checked');

			$grid.closest('.events-section').removeClass('is-empty');

			$grid.isotope({
				filter: function() {
					var $item = $(this);
					if (activeFilter !== '*' && !$item.is(activeFilter)) return false;
					if (coreOnly && $item.attr('data-core') !== 'true') return false;
					if (searchValue && ($item.attr('data-search') || '').indexOf(searchValue) === -1) return false;
					return true;
				}
			});

			var visible = 0;
			$grid.each(function() {
				var iso = $(this).data('isotope');
				var count = iso ? iso.filteredItems.length : 0;
				visible += count;
				$(this).closest('.events-section').toggleClass('is-empty', count === 0);
			});
			$empty.prop('hidden', visible > 0);
		}

		$('.filterbar').on('click', 'button.filter-btn', function() {
			setActiveFilter($(this).attr('data-filter'));
			applyFilters();
			writeFiltersToURL();
		});

		$search.on('input', function() {
			applyFilters();
			writeFiltersToURL();
		});

		$coreToggle.on('change', function() {
			applyFilters();
			writeFiltersToURL();
		});

		// --- Mobile filter modal ---
		var $filterToggle = $('.filter-toggle');
		var $filterModal = $('.filter-modal');
		var $filterOverlay = $('.filter-overlay');

		function setFilterModal(open) {
			$filterToggle.toggleClass('is-open', open);
			$filterModal.toggleClass('is-open', open);
			$filterOverlay.toggleClass('is-open', open);
			if (open) {
				updateFilterHighlight($filterModal.find('.filter-btn.active'));
			}
		}

		$filterToggle.on('click', function() {
			setFilterModal(!$filterModal.hasClass('is-open'));
		});
		$filterOverlay.on('click', function() {
			setFilterModal(false);
		});

		setActiveFilter(activeFilter);
		readFiltersFromURL();
		applyFilters();
	}
	

	
	// Same Page Anchor Scroll Navigation
	var scrollspeed = 1000;
	$('a[href*="#"]')
		.not('[href="#"]')
		.not('[href="#0"]')
		.on('click', function(event) {
			if ($(this).parent().hasClass('toc-entry')) {
				scrollspeed = 100;
			}
			if (
				location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') &&
				location.hostname == this.hostname
			) {
				var target = $(this.hash);
				target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
	
				if (target.length) {
					// event.preventDefault();
					$('html, body').animate({
						scrollTop: target.offset().top - 90 - docBannerHeight()
					}, scrollspeed);
				}
			}
		});

    
    // FAQs
	$('.qa-wrap h3').append('<span class="faq-icon"><svg class="icon"><use href="#chevron-down"></use></svg></span>');
	$('.qa-wrap').on('click', function(event) {
		var $qaWrap = $(this);
		if ($(event.target).is('h3') || $(event.target).closest('h3').length) {
			$qaWrap.toggleClass('open');
			$qaWrap.find('.answer').slideToggle(400);
		} 
		else if (!$qaWrap.hasClass('open')) {
			$qaWrap.addClass('open');
			$qaWrap.find('.answer').slideDown(400);
		}
	});
	$('.qa-wrap .answer a').on('click', function(event) {
		event.stopPropagation();
	});


	/* SIDENAVIGATION Documentation */
	const $drillNav = $('.sidenav-drill');
	const $navRoot = $drillNav.children('.sidenav');

	$navRoot.on('animationend', function(e) {
		if (e.originalEvent.animationName === 'docs-sidebar-enter') $(this).removeClass('nav-motion');
	});

	function setDrill($item, open) {
		$navRoot.addClass('nav-motion');
		$item.toggleClass('is-open', open);
		$item.children('.nav-drill').attr('aria-expanded', open);
		$item.parent('.nav-list').toggleClass('is-drilled', open);
	}

	$drillNav.on('click', '.nav-drill', function() {
		const $item = $(this).parent();
		setDrill($item, true);
		$drillNav.add($navRoot).scrollTop(0);
		$item.find('> .nav-list > .nav-back > button').trigger('focus');
	});

	$drillNav.on('click', '.nav-back button', function() {
		const $item = $(this).closest('.nav-list').parent('.nav-item');
		setDrill($item, false);
		$item.children('.nav-row').trigger('focus');
	});

	const currentNavRow = document.querySelector('.sidenav-drill [aria-current="page"]');
	if (currentNavRow) {
		const navScroller = currentNavRow.closest('.sidenav-drill');
		const rowOffset = currentNavRow.getBoundingClientRect().top - navScroller.getBoundingClientRect().top;
		if (rowOffset > navScroller.clientHeight - 40) {
			navScroller.scrollTop = rowOffset - navScroller.clientHeight / 2;
		}
	}


    /* MOBILE MENU / SUBMENU */
	const $hamburger = $(".hamburger");
	const $landingMenu = $(".landingmenu nav");
	const $sideNavigation = $(".sidenavigation");

	if ($hamburger.length > 0) {
		$hamburger.on("click", function() {
			$(this).toggleClass("is-active");

			if ($landingMenu.length > 0) { // Menu 1: Landingmenu
				$landingMenu.toggleClass("slidein");
				$("body main").toggleClass("inactive");
			}

			if ($sideNavigation.length > 0) { // Menu 2: Sidenavigation
				$sideNavigation.toggleClass("slidein");
				$("body.documentation main .wrap").toggleClass("inactive");
			}
		});

		// Menu 1 Open Submenu
		function setupMobileMenu() {
			if ($landingMenu.length > 0 && window.innerWidth <= 900) {
				$landingMenu.off("click", ".hasSub");
				$landingMenu.on("click", ".hasSub", function(e) {
					e.preventDefault();
					const $submenu = $(this).next(".submenuwrap");
					if ($(this).hasClass("open")) {
						$(this).removeClass("open");
						$submenu.stop().slideUp();
					} else {
						$landingMenu.find(".hasSub").removeClass("open");
						$landingMenu.find(".submenuwrap").slideUp();
						$(this).addClass("open");
						$submenu.stop().slideDown();
					}
				});
			} else {
				$landingMenu.off("click", ".hasSub");
			}
		}

		setupMobileMenu();

		$(window).on('resize', function() {
			setupMobileMenu();
		});
	}

	
	
    
    

    

	
	// Appending Content-List of Overview-Pages
	function cleanNavClone($list) {
		$list.find('.nav-back').remove();
		$list.find('svg').remove();
		$list.find('.nav-drill').replaceWith(function() {
			return $('<span>').text($(this).text());
		});
		$list.removeClass('is-drilled').find('.is-open, .is-drilled').removeClass('is-open is-drilled');
		return $list;
	}

	const $currentNavLink = $('.sidenav-drill [aria-current="page"]');
	if (window.location.href.includes("/overview") && $currentNavLink.length) {
		const $overviewList = $currentNavLink.closest('.nav-list').clone().removeClass('sidenav');
		$overviewList.find('[aria-current="page"]').parent().remove();
		$('#main_content_wrap .index').append(cleanNavClone($overviewList));
	}

	// Appending Content-List of Documentation
	if ($('#docusitemaphere').length) {
		$('#docusitemaphere').append(cleanNavClone($('.sidenav-drill ul.sidenav').clone()));
	}

	// Add class-name to external Links
	$('a').filter(function() {
		return this.hostname && this.hostname !== location.hostname && $(this).find('img, svg').length === 0;
	}).addClass("externallink").attr('target','_blank');
	
	$('.headercontent a, .box-link a, .footercontent a, .download-btn').removeClass('externallink');
	$('table a.externallink:contains(GitHub)').removeClass('externallink').addClass('nobg');
	$('.supporterboard a.externallink').removeClass('externallink').addClass('nobg');

	// Add download icon to links pointing to downloadable files
	$('a').filter(function() {
		var href = $(this).attr('href');
		if (!href) return false;
		return /\.(pdf|zip|tar\.gz|csv|parquet|mp3)(\?.*)?$/i.test(href) && $(this).find('img').length === 0 && !$(this).hasClass('button');
	}).addClass("downloadlink").removeClass("externallink");

	$('.headercontent a, .box-link a, .footercontent a, .download-btn').removeClass('downloadlink');
	$('table a.downloadlink:contains(GitHub)').removeClass('downloadlink').addClass('nobg');
	$('.supporterboard a.downloadlink').removeClass('downloadlink').addClass('nobg');
	
	// Add play icon to links pointing to YouTube or Vimeo
	$('a').filter(function() {
		var href = $(this).attr('href');
		if (!href) return false;
		return /^(https?:)?\/\/(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i.test(href) && $(this).find('img').length === 0 && !$(this).hasClass('button');
	}).addClass("videolink").removeClass("externallink downloadlink");
	
	$('.headercontent a, .box-link a, .footercontent a, .highlight a, .button, .ecosystem-diagram a').removeClass('videolink');
	$('table a.videolink:contains(GitHub)').removeClass('videolink').addClass('nobg');
	$('.supporterboard a.videolink').removeClass('videolink').addClass('nobg');

	// Add podcast icon to links pointing to Spotify or Apple Podcasts
	$('a').filter(function() {
		var href = $(this).attr('href');
		if (!href) return false;
		return /^(https?:)?\/\/(open\.spotify\.com|podcasts\.apple\.com)\//i.test(href) && $(this).find('img').length === 0 && !$(this).hasClass('button');
	}).addClass("podcastlink").removeClass("externallink downloadlink videolink");

	$('.headercontent a, .box-link a, .footercontent a, .highlight a, .button, .ecosystem-diagram a').removeClass('podcastlink');
	$('.supporterboard a.podcastlink').removeClass('podcastlink').addClass('nobg');

	// Glue the anchor icon to the last word of a heading so it never wraps alone
$('h1, h2, h3, h4, h5, h6').find('svg.anchor-icon').each(function() {
	var $svg = $(this);
	var $a = $svg.parent('a');
	if (!$a.length || $a.find('.anchor-wrap').length) return;
	var contents = $a.contents();
	var last = null;
	for (var i = contents.length - 1; i >= 0; i--) {
		if (contents[i] === this) continue;
		last = contents[i];
		break;
	}
	if (!last || last.nodeType !== 3) return;
	var match = last.nodeValue.match(/(\S+)(\s*)$/);
	if (!match) return;
	last.nodeValue = last.nodeValue.slice(0, match.index);
	$('<span class="anchor-wrap"></span>').text(match[1]).append($svg).appendTo($a);
});

// Append sprite icons to external, download, video and podcast links, gluing the icon to the last word
	$('#main_content_wrap, .singleentry .content').find('a.externallink, a.downloadlink, a.videolink, a.podcastlink').each(function() {
		var $a = $(this);
		if ($a.find('svg.linkicon').length) return;
		var icon = $a.hasClass('videolink') ? 'youtube' : ($a.hasClass('podcastlink') ? 'headphones-01' : ($a.hasClass('downloadlink') ? 'download-01' : 'link-external-02'));
		var $svg = $('<svg class="icon linkicon"><use href="#' + icon + '"></use></svg>');
		var contents = $a.contents();
		var last = contents.length ? contents[contents.length - 1] : null;
		var match = (last && last.nodeType === 3) ? last.nodeValue.match(/(\S+)(\s*)$/) : null;
		if (match) {
			last.nodeValue = last.nodeValue.slice(0, match.index);
			$('<span class="linkicon-wrap"></span>').text(match[1]).append($svg).appendTo($a);
		} else {
			$a.append($svg);
		}
	});

	// Copy the heading URL to the clipboard when the anchor-link icon is clicked
	$(document).on('click', 'svg.anchor-icon', function(e) {
		e.preventDefault();
		e.stopPropagation();
		var $svg = $(this);
		var anchor = this.closest('a');
		var url = anchor ? anchor.href : (location.origin + location.pathname + location.hash);
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(url);
		}
		var $use = $svg.find('use');
		if (!$svg.data('original-icon')) {
			$svg.data('original-icon', $use.attr('href'));
		}
		$use.attr('href', '#check');
		$svg.addClass('copied');
		clearTimeout($svg.data('reset-timer'));
		$svg.data('reset-timer', setTimeout(function() {
			$use.attr('href', $svg.data('original-icon'));
			$svg.removeClass('copied');
		}, 1500));
	});

	// CHANGE DOC VERSION
	function closeVersionSelect() {
		var $open = $('.options .version.active');
		if (!$open.length) return false;
		$open.removeClass('active').find('.versiontrigger').attr('aria-expanded', 'false');
		return true;
	}

	$('.options .version .versiontrigger').on('click', function(){
		var $version = $(this).closest('.version');
		var open = !$version.hasClass('active');
		$version.toggleClass('active', open);
		$(this).attr('aria-expanded', open ? 'true' : 'false');
	});

	$(document).on('click', function(e){
		if ($(e.target).closest('.options .version').length) return;
		closeVersionSelect();
	});

	$(document).on('keydown', function(e){
		if (e.key !== 'Escape') return;
		if (closeVersionSelect()) {
			$('.options .version .versiontrigger').trigger('focus');
		}
	});

	// COPY PAGE AS MARKDOWN
	$('.headlinebar .copy-markdown').on('click', function(){
		var $btn = $(this);
		if ($btn.hasClass('copied')) return;

		var markdownPromise = fetch($btn.attr('data-source')).then(function(response){
			if (!response.ok) throw new Error('HTTP ' + response.status);
			return response.text();
		});

		function markCopied() {
			$btn.addClass('copied');
			$btn.find('use').attr('href', '#check');
			$btn.find('span').text('Copied');
			setTimeout(function(){
				$btn.removeClass('copied');
				$btn.find('use').attr('href', '#copy-01');
				$btn.find('span').text('Copy Markdown');
			}, 2000);
		}

		if (navigator.clipboard && window.ClipboardItem) {
			var item = new ClipboardItem({
				'text/plain': markdownPromise.then(function(text){
					return new Blob([text], { type: 'text/plain' });
				})
			});
			navigator.clipboard.write([item]).then(markCopied);
		} else if (navigator.clipboard) {
			markdownPromise.then(function(text){
				return navigator.clipboard.writeText(text);
			}).then(markCopied);
		}
	});
	
	
	
	// LOCAL STORAGE
	function setWithExpiry(key, value, ttl) {
		const now = new Date()
		const item = {
			value: value,
			expiry: now.getTime() + ttl,
		}
		localStorage.setItem(key, JSON.stringify(item))
	}
	function getWithExpiry(key) {
		const itemStr = localStorage.getItem(key)
		if (!itemStr) {
			return null
		}
		const item = JSON.parse(itemStr)
		const now = new Date()
		if (now.getTime() > item.expiry) {
			localStorage.removeItem(key)
			return null
		}
		return item.value
	}


	
	// SEARCH 
	var resultSelected;
	if( OSdatid == "macos" && $('.sidenavigation').length ){
		$('.opensearch .shortcut.win').hide();
		$('.opensearch .shortcut.mac').show();
	}
	var toggleSearch = function(){
		if( $('body').hasClass('search') ){
			$('.searchoverlay').removeClass('active');
			$('body').removeClass('search');
		} else {
			$('.searchoverlay').addClass('active');
			$('body').addClass('search');
			$( ".searchoverlay form input" ).trigger('focus');
		}
	}
	$(window).on('keydown', function (e){
		// close Search on ESC
		if( ( e.which === 27 ) && $('body').hasClass('search') ){
			$('.searchoverlay').removeClass('active');
			$('body').removeClass('search');
		}
		
		if ( e.metaKey && ( e.which === 75 ) || e.ctrlKey && ( e.which === 75 ) ) {
			// open search on cmd/ctrl + k
			e.preventDefault(); // Prevent default browser behavior for all browsers
			if( $('body').hasClass('documentation') || $('body').hasClass('landing') ){
				toggleSearch();
			}
		}
		// de-focus input when on enter or follow the result-link
		if ( e.which === 13  && $('body').hasClass('search') ){
			if( $('.search_result.selected').length ){
				var link = $('.search_result.selected').find('a').attr('href');
				document.location.href = link
			} else {
				$( ".searchoverlay form input" ).trigger('blur');
			}
		}
		
		// scroll through results with up and down keys
		if ( !($("input").is(":focus")) && e.which === 40 && $('body').hasClass('search') || !($("input").is(":focus")) && e.which === 38 && $('body').hasClass('search') ) {
			var result = $('.search_result');
			if(e.which === 40){
				if(resultSelected){
					resultSelected.removeClass('selected');
					next = resultSelected.next();
					if(next.length > 0){
						resultSelected = next.addClass('selected');
					}else{
						resultSelected = result.eq(0).addClass('selected');
					}
				}else{
					resultSelected = result.eq(0).addClass('selected');
				}
			}else if(e.which === 38){
				if(resultSelected){
					resultSelected.removeClass('selected');
					next = resultSelected.prev();
					if(next.length > 0){
						resultSelected = next.addClass('selected');
					}else{
						resultSelected = result.last().addClass('selected');
					}
				}else{
					resultSelected = result.last().addClass('selected');
				}
			}
		}
	});
	
	$('nav .search_icon').on('click', function(){
		toggleSearch();
	});
	$('.opensearch').on('click', function(){
		toggleSearch();
	});
	$('.searchoverlay').on('click', function(e){
		if (e.target !== this)
			return;
		toggleSearch();
	});
	$('.searchoverlay .empty_input').on('click', function(){
		$(".searchoverlay form input").val('').trigger('focus');
		$("#search_results").empty();
	})
	if( $('.hamburger').is(':visible') ){
		$('.search_icon').on('click', function(e){
			if ( $('.hamburger').hasClass('is-active') ){
				if( $('body').hasClass('search') ){
					$('.hamburger').removeClass('is-active');
					$('body.documentation main .wrap.inactive').removeClass('inactive');
					$('.sidenavigation.slidein').removeClass('slidein');
					$('nav.slidein').removeClass('slidein');
				} else {
					$('.sidenavigation').addClass('slidein')
					$('body.documentation main .wrap').addClass('inactive');
				}
			}
		})
	}
	$('.hamburger').on('click', function(){
		if( !$(this).hasClass('is-active') && $('body').hasClass('search') ){
			toggleSearch();
			$('.sidenavigation').fadeIn();
			$('body.documentation main .wrap.inactive').removeClass('inactive');
		}
	});
	
	// UPDATE HIGHLIGHT ELEMENT
	function updateHighlight($container, $item) {
		const $highlight = $container.find(".select-highlight");
		if ($highlight.length && $item.length) {
			const itemOffset = $item.position();
			const itemWidth = $item.outerWidth();
			$highlight.css({
				left: itemOffset.left || 0,
				width: itemWidth || 0,
			});
		}
	}
	
	// DEPLOYMENT DIAGRAM
	const $architectureIllustration = $(".architecture .illustration");
	if ($architectureIllustration.length) {
		const $architectureTabs = $architectureIllustration.find(".architecture-tabs");
		const $diagramItems = $architectureTabs.find("> ul > li");
		const $activeDiagramItem = $diagramItems.filter(".active");

		const $catalogIconsContainer = $architectureIllustration.find('.catalog .icons');
		const $chosenCatalog = $architectureIllustration.find('.choosen-catalog');
		const $clientHeading = $architectureIllustration.find('.diagram .client .client-header h4');
		const $multiLabel = $architectureIllustration.find('.diagram .client .multi-label');

		function updateArchitectureHighlight($item) {
			const $highlight = $architectureTabs.find(".select-highlight");
			if ($highlight.length && $item.length) {
				const itemPos = $item.position();
				$highlight.css({
					top: itemPos.top || 0,
					left: itemPos.left || 0,
					width: $item.outerWidth() || 0,
					height: $item.outerHeight() || 0,
				});
			}
		}

		function updateDiagramView($item) {
			updateArchitectureHighlight($item);

			const iconClassToShow = $item.data('iconclass');
			const tabText = $item.text();
			const currentDataMulti = $item.data('multi');

			$catalogIconsContainer.find('img').removeClass('active-icon');
			if (iconClassToShow) {
				$catalogIconsContainer.find('img.' + iconClassToShow).addClass('active-icon');
			}
			$chosenCatalog.text(tabText);

			$clientHeading.text(currentDataMulti === true ? 'Clients' : 'Client');
			$multiLabel.text(currentDataMulti === true ? 'Multiple clients' : 'Single client');

			const $browserWrap = $architectureIllustration.find('.client .browser-wrap');
			if (currentDataMulti === true) {
				$browserWrap.addClass('contains-multi');
			} else {
				$browserWrap.removeClass('contains-multi');
			}
		}

		updateDiagramView($activeDiagramItem);

		$diagramItems.on('click', function () {
			const $this = $(this);
			$diagramItems.removeClass("active");
			$this.addClass("active");
			updateDiagramView($this);
		});
	}
	
	// QUICK INSTALLATION ON LANDING/HOME PAGE
	if ($("#quickinstall .install .environment").length) {
		const $envTopbar = $("#quickinstall .install .environment");
		const $envItems = $envTopbar.find("> ul > li");
		const $activeEnvItem = $envItems.filter(".active");
		const $installBox = $("#quickinstall .install");

		function updateInstallation($item) {
			updateHighlight($envTopbar, $item);
			const activeClient = $item.attr("data-client");
			$installBox.attr("data-active", activeClient);
			let installation = $(
				`#quick-installation div[data-install='${activeClient} ${OSdatid}']`
			).html();
			if (!installation) {
				installation = $(
					`#quick-installation div[data-install='${activeClient}']`
				).html();
			}
			$("#quickinstall .result").html(installation);
		}

		updateInstallation($activeEnvItem);

		$envItems.on('click', function () {
			$envItems.removeClass("active");
			$(this).addClass("active");
			updateInstallation($(this));
		});
	}
	




	
	/** HIGHLIGHT TOC MENU **/
	if ( $('body').hasClass('documentation') ) {
		var headings = $('#main_content_wrap h1, #main_content_wrap h2, #main_content_wrap h3');
		var tocEntries = $('.toc-entry');
	
		$(window).on('scroll', function() {
			var scrollPos = $(window).scrollTop() + 150; // top offset
			var documentHeight = $(document).height();
	
			headings.each(function(index, element) {
				var id = $(element).attr('id');
				var offset = $(element).offset().top;
	
				if (scrollPos >= offset) {
					tocEntries.removeClass('current');
					$('.toc-entry a[href="#' + id + '"]').parent().addClass('current');
				}
			});
	
			if (scrollPos + $(window).height() >= documentHeight - 20) {
				tocEntries.removeClass('current'); 
				$('.toc-entry:last').addClass('current'); 
			}
		});
	}
	
	/** HIGHLIGHT TOC MENU ON BLOG POSTS **/
	if ( $('.postcontent .toc_sidebar').length ){
		var headings = $('.singleentry h1, .singleentry h2,  .singleentry h3');
		var tocEntries = $('.toc-entry');
		
		$(window).on('scroll', function() {
			var scrollPos = $(window).scrollTop() + 150; // top offset
			var documentHeight = $(document).height();
		
			headings.each(function(index, element) {
				var id = $(element).attr('id');
				var offset = $(element).offset().top;
		
				if (scrollPos >= offset) {
					tocEntries.removeClass('current');
					$('.toc-entry a[href="#' + id + '"]').parent().addClass('current');
				}
			});
		
			if (scrollPos + $(window).height() >= documentHeight - 20) {
				tocEntries.removeClass('current'); 
				$('.toc-entry:last').addClass('current'); 
			}
		});
	}
	
	/** HIGHLIGHT TOC MENU FOR DEFAULT LAYOUT **/
	if ($('#main_content_wrap.contains_toc').length) {
		var headings = $('#main_content_wrap h2, #main_content_wrap h3');
		var tocEntries = $('.toc-entry');
		
		$(window).on('scroll', function() {
			var scrollPos = $(window).scrollTop() + 150; // top offset
			var documentHeight = $(document).height();
		
			headings.each(function(index, element) {
				var id = $(element).attr('id');
				var offset = $(element).offset().top;
		
				if (scrollPos >= offset) {
					tocEntries.removeClass('current');
					$('.toc-entry a[href="#' + id + '"]').parent().addClass('current');
				}
			});
		
			if (scrollPos + $(window).height() >= documentHeight - 20) {
				tocEntries.removeClass('current'); 
				$('.toc-entry:last').addClass('current'); 
			}
		});
	}
	
	
	/** HIDE BANNER **/
	const $homeBanner = $('.banner').not('.docversion');
	const showbanner = getWithExpiry("homeBanner");
	if(showbanner == false){
		$homeBanner.css('display', 'none');
	} else {
		$homeBanner.css('display', 'flex');
	}
	$homeBanner.find('.close').on('click', function(){
		setWithExpiry('homeBanner', false, 172800000); // 900000 = 15 min, 172800000 = 2 days
		$homeBanner.slideUp(300);
	});

	/** DOCS VERSION BANNER HEIGHT **/
	var docBanner = document.querySelector('.banner.docversion');
	if (docBanner) {
		var syncDocBannerHeight = function() {
			document.body.style.setProperty('--docbanner-height', docBanner.offsetHeight + 'px');
		};
		syncDocBannerHeight();
		window.addEventListener('resize', syncDocBannerHeight);
	}
	//setWithExpiry('homeBanner', '', -1); // deletes content
	
	
	/** ADD WORD-BOXES TO CODE TABLES */
	$('.monospace_table + table tbody td').each(function() {
		$(this).wrapInner('<code class="language-plaintext"></code>');
	});
	
	
	// Video Thumbnail – Click to Play
	$('.video-thumbnail').on('click', function() {
		const videoContainer = $(this).siblings('.video-container');
		const iframe = videoContainer.find('iframe');

		const baseSrc = iframe.data('src');
		iframe.attr('src', baseSrc + '?autoplay=1');
		
		videoContainer.show();
		$(this).hide();
	});
});


// Author marquee: keep the scroll speed constant regardless of name length
$(document).on('mouseenter', '.postpreview', function() {
	var author = this.querySelector('.byline .author, .meta .author');
	if (!author) return;
	var span = author.querySelector('span');
	if (!span) return;

	var distance = span.scrollWidth - author.clientWidth;
	if (distance < 24) {
		author.style.removeProperty('--marquee-duration');
		return;
	}

	var SPEED = 65;      // pixels per second
	var MOVING = 0.92;   // share of the animation that is not a pause
	var duration = distance / SPEED / MOVING;
	author.style.setProperty('--marquee-duration', duration.toFixed(2) + 's');
});
