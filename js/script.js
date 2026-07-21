$(document).ready(function(){
	
	if (window.location.hash) {
		var hash = window.location.hash;
		if ($(hash).length) {
			$('html, body').animate({
				scrollTop: $(hash).offset().top-90
			}, 300, 'swing');
			if( $('.frequentlyaskedquestions').length ){
				$('h3'+hash).parent('.qa-wrap').addClass('open');
				$('h3'+hash).parent('.qa-wrap').find('.answer').slideToggle(300);
			}
		}
	}
	
	var windowWidth = $( window ).width();
	
	
	/** DARK MODE SWITCH */
	var isDark = document.documentElement.classList.contains('darkmode');
	$('.mode').attr('data-mode', isDark ? 'light' : 'dark');

	setTimeout(() => {
		document.documentElement.classList.remove('disable-transitions');
	}, 300);
	
	$('.mode').click(function() {
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
	
	// Get URL Parameter
	var getUrlParameter = function getUrlParameter(sParam) {
	    var sPageURL = window.location.search.substring(1),
	        sURLVariables = sPageURL.split('&'),
	        sParameterName,
	        i;
	
	    for (i = 0; i < sURLVariables.length; i++) {
	        sParameterName = sURLVariables[i].split('=');
	
	        if (sParameterName[0] === sParam) {
	            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
	        }
	    }
	return "undefined";
	};
	
	
	/** FILTER LINE  */
	if ($('.filterbar').length !== 0) {

		/* CUSTOM FITROWS FUNCTION FOR ISOTOPE TO GET EQUAL HEIGHT TILES */
		!function(t){"use strict";function i(t){var i=t.create("fitRows");return i.prototype._resetLayout=function(){if(this.x=0,this.y=0,this.maxY=0,this.row=0,this.rows=[],this._getMeasurement("gutter","outerWidth"),this.options.equalheight)for(var t=0;t<this.isotope.items.length;t++)this.isotope.items[t].css({height:"auto"})},i.prototype._getItemLayoutPosition=function(t){t.getSize();var i=this.gutter||0,s=t.size.outerWidth,o=Math.ceil(this.isotope.size.innerWidth+i);0!==this.x&&s+this.x+i>o&&(this.x=0,this.y=this.maxY+i),0===this.x&&0!==this.y&&this.row++;var e={x:this.x,y:this.y};return this.maxY=Math.max(this.maxY,this.y+t.size.outerHeight),this.x+=s+i,void 0===this.rows[this.row]?(this.rows[this.row]=[],this.rows[this.row].start=this.y,this.rows[this.row].end=this.maxY):this.rows[this.row].end=Math.max(this.rows[this.row].end,this.maxY),t.row=this.row,e},i.prototype._equalHeight=function(){for(var t=0;t<this.isotope.items.length;t++){var i=this.isotope.items[t].row,s=this.rows[i];if(s){var o=s.end-s.start;o-=this.isotope.items[t].size.borderTopWidth+this.isotope.items[t].size.borderBottomWidth,o-=this.isotope.items[t].size.marginTop+this.isotope.items[t].size.marginBottom,o-=this.gutter.height||0,!1==this.isotope.items[t].size.isBorderBox&&(o-=this.isotope.items[t].size.paddingTop+this.isotope.items[t].size.paddingBottom),this.isotope.items[t].size.height=o,this.isotope.items[t].css({height:o.toString()+"px"})}}},i.prototype._getContainerSize=function(){return this.options.equalheight&&this._equalHeight(),{height:this.maxY}},i}"function"==typeof define&&define.amd?define(["../layout-mode"],i):"object"==typeof exports?module.exports=i(require("../layout-mode")):i(t.Isotope.LayoutMode)}(window);

		var $grid = $('.newstiles').isotope({
			itemSelector: '.postpreview',
			layoutMode: 'fitRows',
			fitRows: {
				gutter: 20,
				equalheight: true
			},
			getSortData: {
				title: '[data-title]'
			}
		});

		// --- Filter highlight ---
		function updateFilterHighlight($button) {
			var $filtertags = $button.closest('.filtertags');
			var $highlight = $filtertags.find('.filter-highlight');
			if ($highlight.length && $button.is(':visible')) {
				$highlight.css({
					left: $button.position().left,
					width: $button.outerWidth()
				});
			}
		}

		// Initialize highlights for all visible filter groups
		$('.filtertags').each(function() {
			var $activeBtn = $(this).find('.filter-btn.active');
			if ($activeBtn.length) {
				updateFilterHighlight($activeBtn);
			}
		});

		// --- Filter state per group ---
		var filterState = {};

		$('.filter-group').each(function() {
			var key = $(this).attr('data-filter-key');
			if (key) {
				filterState[key] = '*';
			}
		});

		function applyFilters() {
			var searchValue = $('#search-input').val().toLowerCase();

			$grid.isotope({
				filter: function() {
					var $item = $(this);
					if (searchValue) {
						var title = $item.attr('data-title').toLowerCase();
						if (!title.includes(searchValue)) return false;
					}
					for (var key in filterState) {
						var value = filterState[key];
						if (value === '*') continue;

						var $group = $('.filter-group[data-filter-key="' + key + '"]').not('.filter-group-mobile-only').first();
						var $filtertags = $group.find('.filtertags');
						var attribute = $filtertags.attr('data-attribute');

						if (attribute) {
							var itemValue = $item.attr(attribute);
							if (itemValue !== value) return false;
						} else {
							if (!$item.is(value)) return false;
						}
					}
					return true;
				}
			});
		}

		// Sync duplicate filter groups (desktop ↔ mobile-only) by filter-key
		function syncFilterGroups($clickedBtn) {
			var $group = $clickedBtn.closest('.filter-group');
			var key = $group.attr('data-filter-key');
			var filterValue = $clickedBtn.attr('data-filter');

			$('.filter-group[data-filter-key="' + key + '"]').each(function() {
				var $otherFiltertags = $(this).find('.filtertags');
				$otherFiltertags.find('.filter-btn').removeClass('active');
				var $matchingBtn = $otherFiltertags.find('.filter-btn[data-filter="' + filterValue + '"]');
				$matchingBtn.addClass('active');
				if ($matchingBtn.is(':visible')) {
					updateFilterHighlight($matchingBtn);
				}
			});
		}

		// --- Click handler for filter buttons ---
		$('.filterbar').on('click', 'button.filter-btn', function() {
			var $btn = $(this);
			var $group = $btn.closest('.filter-group');
			var key = $group.attr('data-filter-key');
			var filterValue = $btn.attr('data-filter');

			if (key) {
				filterState[key] = filterValue;
			}

			syncFilterGroups($btn);
			applyFilters();
		});

		// --- Search input ---
		$('#search-input').on('input', function() {
			applyFilters();
		});

		// --- Mobile filter modal ---
		var $filterToggle = $('.filter-toggle');
		var $filterModal = $('.filter-modal');
		var $filterOverlay = $('.filter-overlay');
		var filterModalOpen = false;

		function openFilterModal() {
			filterModalOpen = true;
			$filterToggle.addClass('is-open');
			$filterOverlay.addClass('is-open');
			$filterModal.addClass('is-open');
			$filterModal.find('.filtertags').each(function() {
				var $activeBtn = $(this).find('.filter-btn.active');
				if ($activeBtn.length) {
					updateFilterHighlight($activeBtn);
				}
			});
		}

		function closeFilterModal() {
			filterModalOpen = false;
			$filterToggle.removeClass('is-open');
			$filterModal.removeClass('is-open');
			$filterOverlay.removeClass('is-open');
		}

		function toggleFilterModal() {
			if (filterModalOpen) {
				closeFilterModal();
			} else {
				openFilterModal();
			}
		}

		$filterToggle.on('click', toggleFilterModal);
		$filterOverlay.on('click', closeFilterModal);
	}
	

	
	// Same Page Anchor Scroll Navigation
	var scrollspeed = 1000;
	$('a[href*="#"]')
		.not('[href="#"]')
		.not('[href="#0"]')
		.click(function(event) {
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
						scrollTop: target.offset().top - 90
					}, scrollspeed);
				}
			}
		});

    
    // FAQs
	$('.qa-wrap h3').append('<span class="faq-icon"><svg class="icon"><use href="#chevron-down"></use></svg></span>');
	$('.qa-wrap').click(function(event) {
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
	$('.qa-wrap .answer a').click(function(event) {
		event.stopPropagation();
	});


	/* SIDENAVIGATION Documentation */
	$('.sidenavigation .hasSub').click(function(){
		$(this).next('ul').slideToggle();
		$(this).toggleClass('opened'); 
	});

	$('.sidenavigation li.benchmarking').click(function(){
		$('.sidenavigation li.documentation.opened').toggleClass('opened').next('ul').slideToggle();
	});
	$('.sidenavigation li.documentation').click(function(){
		$('.sidenavigation li.benchmarking.opened').toggleClass('opened').next('ul').slideToggle();
	})
	if($('li.hasSub.opened.benchmarking').length != 0){
		$('.sidenavigation li.documentation.opened').toggleClass('opened').next('ul').hide();
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

		$(window).resize(function() {
			setupMobileMenu();
		});
	}

	
	
    
    // Scroll Top Button 
    $('.scrolltop').click(function(){
	    $("html, body").animate({ scrollTop: 0 }, 600, 'swing');
	    return false;
	});
    

    
	if( !$('.hamburger').is(':visible') ){
		$('#duckdbanimation, .duckdbhome img.downloadlogo').mouseenter(function() {
			animationduckDBicon.play();
			animationduckDBicon.setDirection(1)
		})
		$('#duckdbanimation, .duckdbhome img.downloadlogo').mouseleave(function() {
			animationduckDBicon.play();
			animationduckDBicon.setDirection(-1)
		})
	}

	
	// Landing Page Typewriter Animation
	if( $('.landing .type').length ){
		var $typeElement = $('.type');
		var strings = $typeElement.data('strings').split('|');
		var typewriter = new Typewriter($typeElement[0], {
			loop: true, 
			delay: 50,
			wrapperClassName: "typewrapper",
			cursorClassName: "typecursor",
			cursor: "|"
			//cursor: "⎪"
		});
		
		strings.forEach(function(str) {
			typewriter.typeString(str)
				.pauseFor(2500)
				.deleteAll();
		});
		
		typewriter.start();
	}
	
	
	
	// Appending Content-List of Overview-Pages
	const pathname = window.location.pathname.replace(/\.html$/, '');
	if (window.location.href.includes("/overview")) {
		const selector = `li.opened a[href="${pathname}"]`;
		const clonedUL = $(selector).parent().parent().clone();
		clonedUL.find(selector).parent().remove();
		clonedUL.find('svg').remove();
		clonedUL.find('ul').show();
		$('#main_content_wrap .index').append(clonedUL);
	}

	
	// Appending Content-List of Documentation
	if ( $('#docusitemaphere').length ) {
	    contentlist = $('ul.sidenav').clone()
	    contentlist.find('svg').remove()
	    $('#docusitemaphere').append(contentlist).find("ul").removeAttr("style")
	}
	
	// Add class-name to external Links
	$('a').filter(function() {
		return this.hostname && this.hostname !== location.hostname && $(this).find('img, svg').length === 0;
	}).addClass("externallink").attr('target','_blank');
	
	$('.headercontent a, .mainlinks a, .box-link a, .footercontent a').removeClass('externallink');
	$('table a.externallink:contains(GitHub)').removeClass('externallink').addClass('nobg');
	$('.supporterboard a.externallink').removeClass('externallink').addClass('nobg');

	// Add download icon to links pointing to downloadable files
	$('a').filter(function() {
		var href = $(this).attr('href');
		if (!href) return false;
		return /\.(pdf|zip|tar\.gz|csv|parquet|mp3)(\?.*)?$/i.test(href) && $(this).find('img').length === 0 && !$(this).hasClass('button');
	}).addClass("downloadlink").removeClass("externallink");

	$('.headercontent a, .mainlinks a, .box-link a, .footercontent a').removeClass('downloadlink');
	$('table a.downloadlink:contains(GitHub)').removeClass('downloadlink').addClass('nobg');
	$('.supporterboard a.downloadlink').removeClass('downloadlink').addClass('nobg');
	
	// Add play icon to links pointing to YouTube or Vimeo
	$('a').filter(function() {
		var href = $(this).attr('href');
		if (!href) return false;
		return /^(https?:)?\/\/(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i.test(href) && $(this).find('img').length === 0 && !$(this).hasClass('button');
	}).addClass("videolink").removeClass("externallink downloadlink");
	
	$('.headercontent a, .mainlinks a, .box-link a, .footercontent a, .highlight a, .button, .ecosystem-diagram a').removeClass('videolink');
	$('table a.videolink:contains(GitHub)').removeClass('videolink').addClass('nobg');
	$('.supporterboard a.videolink').removeClass('videolink').addClass('nobg');
	
	// FOUNDATION PAGE SCRIPTS
	if($('body').hasClass('foundation') && $('section.form').length){
		var hash = window.location.hash.replace('#', '');
		if( hash.length ){
			$('div.select .select-text').val(hash);
		}
		
		// AJAX FORM SEND
		$("#ajaxForm").submit(function(e){
			e.preventDefault();
			var action = $(this).attr("action");
			
			$('#ajaxForm button[type="submit"]').hide();
			$('#ajaxForm .lds-ellipsis').fadeIn();
			
			$.ajax({
				type: "POST",
				url: action,
				crossDomain: true,
				data: new FormData(this),
				dataType: "json",
				processData: false,
				contentType: false,
				headers: {
					"Accept": "application/json"
				}
			}).done(function() {
				$('#ajaxForm').addClass('inactive');
				$('#ajaxForm .lds-ellipsis').hide();
				$('.success').addClass('is-active');
			}).fail(function() {
				alert('An error occurred! Please try again later.');
				$('#ajaxForm button[type="submit"]').show();
				$('#ajaxForm .lds-ellipsis').hide();
			});
			
		});
	
	}
	
	
	// CHANGE DOC VERSION
	function closeVersionSelect() {
		var $open = $('.options .version.active');
		if (!$open.length) return false;
		$open.removeClass('active').find('.versiontrigger').attr('aria-expanded', 'false');
		return true;
	}

	$('.options .version .versiontrigger').click(function(){
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
	$('.headlinebar .copy-markdown').click(function(){
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
	var base_url = window.location.origin;
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
			$( ".searchoverlay form input" ).focus();
		}
	}
	$(window).keydown(function (e){
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
				$( ".searchoverlay form input" ).blur();
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
	
	$('nav .search_icon').click(function(){
		toggleSearch();
	});
	$('.opensearch').click(function(){
		toggleSearch();
	});
	$('.searchoverlay').click(function(e){
		if (e.target !== this)
			return;
		toggleSearch();
	});
	$('.searchoverlay .empty_input').click(function(){
		$(".searchoverlay form input").val('').focus();
		$("#search_results").empty();
	})
	if( $('.hamburger').is(':visible') ){
		$('.search_icon').click(function(e){
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
	$('.hamburger').click(function(){
		if( !$(this).hasClass('is-active') && $('body').hasClass('search') ){
			toggleSearch();
			$('.sidenavigation').fadeIn();
			$('body.documentation main .wrap.inactive').removeClass('inactive');
		}
	});
	
	// ADDING LINES TO CODE FIELDS IF DEFINED
	var addLineNumbers = function(){
		if( $('.window .content.haslines').length ){
			$('.window .content.haslines').each(function(){
				var height = $(this).find('pre').height()
				var fontSize = $(this).find('pre').css('font-size');
				var lineHeight = 18;//Math.floor(parseInt(fontSize.replace('px','')) * 1.2);
				var lines = Math.ceil(height / lineHeight) + 1
				var linenumbers = '';
				for (i = 1; i < lines; i++) {
					linenumbers += i + '<br>'
				}
				$(this).find('.lines').html(linenumbers);
			})
		}
	}
	addLineNumbers();

	
	// GENERAL ACCORDION FOLDOUT
	if( $('.accordion').length ){
		$('.foldout').click(function(){
			$(this).toggleClass('active').find('.content').slideToggle();
		})
	}
	
	// STARTPAGE EXAMPLE CODE WINDOW
	var updateExample = function(){
		//var exampleSelection = $('#example-select').find(":selected").val();
		var exampleSelection = $('#example-select ~ ul.select-options li.is-selected').attr('rel');
		var languageSelection = $('.demo.window ul.lang li.active').attr('data-language');
		var exampleCode = $('.examples.hero-demo').find('div[data-language='+languageSelection+'][data-example='+exampleSelection+']').html();
		var buttonTxt = $('.examples.hero-demo').find('div[data-language='+languageSelection+'][data-example='+exampleSelection+']').attr('data-buttontxt');
		var buttonUrl = $('.examples.hero-demo').find('div[data-language='+languageSelection+'][data-example='+exampleSelection+']').attr('data-buttonurl');
		//console.log("Example: " + exampleSelection + " Language: " + languageSelection);
		//console.log("Buttontext: " + buttonTxt);
		$('.demo.window .content .code').html(exampleCode);
		addLineNumbers();
		if( buttonTxt.length ){
			$('.demo.window .bottombar a.livedemo').text(buttonTxt);
			$('.demo.window .bottombar a.livedemo').attr('href', buttonUrl);
		}
	}

			
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

		$diagramItems.click(function () {
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

		$envItems.click(function () {
			$envItems.removeClass("active");
			$(this).addClass("active");
			updateInstallation($(this));
		});
	}
	
	/** CUSTOM SELECT ON HOME **/
	var generateSelectBoxes = function(){   
		$('body.landing select').each(function() {
			var $this = $(this),
				numberOfOptions = $(this).children('option').length;
	
			$this.addClass('select-hidden');
			$this.after('<div class="select-styled">' + ($this.children('option:selected').text() || 'Select') + '</div>'); 
	
			var $styledSelect = $this.next('div.select-styled');
			var $list = $('<ul />', {
				'class': 'select-options'
			}).insertAfter($styledSelect);
	
			for (var i = 0; i < numberOfOptions; i++) {
				$('<li />', {
					text: $this.children('option').eq(i).text(),
					rel: $this.children('option').eq(i).val()
				}).appendTo($list);
				if ($this.children('option').eq(i).is(':selected')) {
					$('li[rel="' + $this.children('option').eq(i).val() + '"]').addClass('is-selected');
				}
			}
	
			var $listItems = $list.children('li');
	
			$styledSelect.click(function(e) {
				e.stopPropagation();
				$('div.select-styled.active').not(this).each(function() {
					$(this).removeClass('active').next('ul.select-options').hide();
				});
				$(this).toggleClass('active').next('ul.select-options').slideToggle(200); 
				if ($(this).hasClass('active')) {
					$(this).html('<span>Select</span>'); 
				} else {
					var selectedText = $this.children('option:selected').text() || 'Select';
					$(this).html(selectedText); 
				}
			});
	
			$listItems.click(function(e) {
				e.stopPropagation();
				var selectedText = $(this).text();
				$styledSelect.html(selectedText).removeClass('active');
				$this.val($(this).attr('rel'));
				$list.find('li.is-selected').removeClass('is-selected');
				$(this).addClass('is-selected');
				$list.hide();
				updateExample();
			});
	
			$(document).click(function() {
				$styledSelect.removeClass('active');
				$list.hide();
				var selectedText = $this.children('option:selected').text() || 'Select';
				$styledSelect.html(selectedText); 
			});
	
			$this.change(function() {
				var selectedText = $(this).children('option:selected').text() || 'Select';
				$styledSelect.html(selectedText); 
			});
		});
	}
	
	generateSelectBoxes();




	
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
	const showbanner = getWithExpiry("homeBanner");
	if(showbanner == false){
		$('.banner').css('display', 'none');
		if( $('body').hasClass('documentation') ){
			$('main').removeAttr('class');
		}
	} else {
		$('.banner').css('display', 'flex');
	}
	$('.banner .close').click(function(){
		setWithExpiry('homeBanner', false, 172800000); // 900000 = 15 min, 172800000 = 2 days
		$('.banner').slideUp(300);
		if( $('body').hasClass('documentation') ){
			$('main').removeAttr('class');
		} 
	});
	//setWithExpiry('homeBanner', '', -1); // deletes content
	
	
	/** ADD WORD-BOXES TO CODE TABLES */
	$('.monospace_table + table tbody td').each(function() {
		$(this).wrapInner('<code class="language-plaintext"></code>');
	});
	
	
	// Video Thumbnail – Click to Play
	$('.video-thumbnail').click(function() {
		const videoContainer = $(this).siblings('.video-container');
		const iframe = videoContainer.find('iframe');

		const baseSrc = iframe.data('src');
		iframe.attr('src', baseSrc + '?autoplay=1');
		
		videoContainer.show();
		$(this).hide();
	});
});
