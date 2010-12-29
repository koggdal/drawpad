/*!
 * BrowserCheck
 *
 * by Johannes Koggdal
 *
 * Gets and stores information about the current browser
 * Also adds classes to the html tag for styling for specific browsers
 *
 * Borrowed and edited code from the jQuery source
 * Thanks to the jQuery Team
 */
(function(window,document,undefined){
	
	window.browserCheck = {
	
		userAgent: navigator.userAgent,
			
		uaMatch: function( ua ) {
			ua = ua.toLowerCase();
			
			// Useragent RegExp
			var rwebkit = /(webkit)[ \/]([\w.]+)/,
			ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
			rmsie = /ms(ie) ([\w.]+)/,
			rfirefox = /(firefox)\/([\w.]+)/,
			rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/,
			mac = /(mac).*?([\d\.]+);/,
			windows = /(windows);/,
			windows_compatible = /; (windows) nt/,
			linux = /(linux)/,
			ios = /(iphone|ipad).*? os (|\d|\d_\d|\d_\d_\d) /,
			android = /(android) (\d\.\d)/;
			
	
			var match = rwebkit.exec( ua ) ||
				ropera.exec( ua ) ||
				rmsie.exec( ua ) ||
				ua.indexOf("compatible") < 0 && rfirefox.exec( ua ) ||
				ua.indexOf("compatible") < 0 && rmozilla.exec( ua ) ||
				[],
				
				match_os = android.exec( ua ) ||
				ios.exec( ua ) ||
				mac.exec( ua ) ||
				windows.exec( ua ) ||
				windows_compatible.exec( ua ) ||
				linux.exec( ua ) ||
				[],
				
				version_parts = match[2].split("."),
				version_parts_os = match_os[2] ? match_os[2].split(".") : [],
				classes = [match[1],match_os[1]],
				lastClass = '',
				lastClassOS = '';
			
			if( version_parts_os.length == 1 )
				version_parts_os = match_os[2].split("_");
				
			var output = match_os[1];
			
			for(var i = 0; i < version_parts.length; i++){
				classes.push(match[1]+lastClass+version_parts[i]);
				lastClass += version_parts[i];
			}
			
			for(var i = 0; i < version_parts_os.length; i++){
				output += "\n"+match_os[1]+lastClassOS+version_parts_os[i];
				classes.push(match_os[1]+lastClassOS+version_parts_os[i]);
				lastClassOS += version_parts_os[i];
			}
			
			return { browser: match[1] || "", version: match[2] || "0", os: match_os[1] || "", classNames: classes };
		},
	
		browser: {},
		os: {},
		
		add: function(){	
			var browserMatch = browserCheck.uaMatch( browserCheck.userAgent );
			if ( browserMatch.browser ) {
				browserCheck.browser[ browserMatch.browser ] = true;
				browserCheck.browser.version = browserMatch.version;
				browserCheck.browser.name = browserMatch.browser;
				browserCheck.browser.classNames = browserMatch.classNames;
				browserCheck.os.name = browserMatch.os;
				if(browserMatch.os.length > 0)
					browserCheck.os[ browserMatch.os ] = true;
			}
		},
		
		addClass: function(className){
			var classes = document.documentElement.className;
			document.documentElement.className += (classes == "") ? className : " "+className;
		},
		
		addClasses: function(){
			var classes = browserCheck.browser.classNames,
				len = classes.length;
			for(var i = len; i--;)
				browserCheck.addClass(classes[i]);
		}
	};
	
	browserCheck.add();
	browserCheck.addClasses();

})(window,document);