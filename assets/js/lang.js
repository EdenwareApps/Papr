function getDefaultLocale(short, noUnderline){
	var lang = window.navigator.languages ? window.navigator.languages[0] : null;
	lang = lang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage;
	if(!noUnderline){
		lang = lang.replace('-', '_');
	}
	lang = lang.substr(0, short ? 2 : 5);
	return lang;
}

function getLocale(short, noUnderline){
	var lang = Config.get('locale');
	if(!lang || typeof(lang)!='string'){
		lang = getDefaultLocale(short, noUnderline);
	}
	if(!noUnderline){
		lang = lang.replace('-', '_');
	}
	lang = lang.substr(0, short ? 2 : 5);
	return lang;
}

function loadLanguage(locales, callback){
	var locale = locales.shift();
	jQuery.getJSON("/lang/"+locale+".json", function( data ) {
		Lang = data;
		if(locale == 'en'){
			callback()
		} else {
			jQuery.getJSON("/lang/en.json", function( data ) { // always load EN language as fallback for missing translations
				Lang = Object.assign(data, Lang);
				callback()
			})
		}
	}).fail(function (jqXHR, textStatus, errorThrown) {
		if(locales.length){
			loadLanguage(locales, callback)
		} else {
			console.error(jqXHR);
			console.error(textStatus);
			console.error(errorThrown);
		}
	})
}

var Lang = {};
jQuery(() => {
	loadLanguage([getLocale(false), getLocale(true), 'en'], () => {            
		jQuery(() => {
			jQuery(document).triggerHandler('lngload')
		})
	})
})