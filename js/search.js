let searchDataLoaded = false; // Flag to prevent multiple loads

function loadSearchData() {
	if (searchDataLoaded) return; // Skip if already loaded

	const xhr = new XMLHttpRequest();
	xhr.open('GET', '/data/search_data.json');
	xhr.onreadystatechange = function(event) {
		if (this.readyState === 4) {
			const { data } = JSON.parse(this.responseText);
			let documents = data.map((item, id) => ({id, ...item}));

			// Add documents to the index
			miniSearch.addAll(documents);

			searchDataLoaded = true; // Mark data as loaded
			
			console.log("search_data.json successfully loaded and indexed.");
		}
	};
	xhr.send();
}

// Event listeners to load search data only on interaction
const text_div = document.getElementById("q");
text_div.addEventListener('focus', loadSearchData);
text_div.addEventListener('input', loadSearchData);
text_div.addEventListener('keydown', loadSearchData);

const tokenize = (string) => string.split(/[\s-.]+/); // search query tokenizer

// Create a search engine that indexes the 'title' and 'text' fields for
// full-text search. Search results will include 'title' and 'category' (plus the
// id field, that is always stored and returned)
const miniSearch = new MiniSearch({
	fields: ['title', 'text', 'category', 'blurb'],
	storeFields: ['title', 'text', 'category', 'url', 'blurb', 'type'],
	tokenize,
	searchOptions: { tokenize }
})

// read GET parameters (https://stackoverflow.com/questions/12049620/how-to-get-get-variables-value-in-javascript)
// lord knows why this needs a regex and hasn't been part of the JS standard since day 1
var $_GET = {};
if(document.location.toString().indexOf('?') !== -1) {
    var query = document.location
                   .toString()
                   // get the query string
                   .replace(/^.*?\?/, '')
                   // and remove any existing hash string (thanks, @vrijdenker)
                   .replace(/#.*$/, '')
                   .split('&');

    for(var i=0, l=query.length; i<l; i++) {
       var aux = decodeURIComponent(query[i]).split('=');
       $_GET[aux[0]] = aux[1];
    }
}
function bold_blurb(blurb, query) {
	if (blurb === undefined) {
		return blurb
	}
	const querySplits = query.toLowerCase().split(" ");
	for(let split of querySplits) {
		if (split.length == 0) {
			continue
		}
		let startIndex = 0
		let splitLength = split.length
		while(startIndex < blurb.length) {
			let index = blurb.toLowerCase().indexOf(split, startIndex)
			if (index < 0) {
				break
			}
			blurb = blurb.substr(0, index) + "<u>" + blurb.substr(index, splitLength) + "</u>" + blurb.substr(index + splitLength)
			startIndex = index + splitLength + 7
		}
	}
	return blurb
}

// Check what page we are
let currentPageType = 'all'; 
if (window.location.pathname.includes('/docs/')) {
	currentPageType = 'documentation';
} else if (window.location.pathname.includes('/news/')) {
	currentPageType = 'blog';
}

function perform_search(query) {
	let searchOptions = {
		boost: { title: 100, category: 20, blurb: 2 },
		prefix: true,
		fuzzy: 0.2
	};
	
	// Filter search results depending on what page we are
	if (currentPageType === 'documentation') {
		searchOptions.filter = (doc) => doc.type === 'documentation';
	} else if (currentPageType === 'blog') {
		searchOptions.filter = (doc) => doc.type === 'blog';
	}
	
	let results = miniSearch.search(query, searchOptions);
	let search_div = document.getElementById("search_results");
	let search_html = "";
	let max_index = 20;
	for(let i = 0; i < results.length; i++) {
		search_html += "<div class='search_result ";
		if (i % 2 == 0) {
			search_html += "search_result_even";
		} else {
			search_html += "search_result_uneven";
		}
		search_html += "'>";
		search_html += "<a href='" + results[i].url + "'>";
		search_html += "</a> ";
		search_html += "<h2 class='search_title'>";
		search_html += bold_blurb(results[i].title, query);
		search_html += "</h2>";
		search_html += "<div class='search_text'>";
		search_html += bold_blurb(results[i].blurb, query);
		search_html += "</div>";
		search_html += "<span class='search_category'>";
		search_html += results[i].category;
		search_html += "</span>";
		search_html += "</div>";
		if (i >= max_index) {
			break;
		}
	}
	search_div.innerHTML = search_html;
}

//get the 'index' query parameter
if ($_GET['q']!==undefined) {
	perform_search($_GET['q']);
}

function on_update(e) {
	perform_search(e.target.value);
}

text_div.addEventListener('keyup', on_update);
text_div.addEventListener('input', on_update);

text_div.addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		e.preventDefault();
	}
});
