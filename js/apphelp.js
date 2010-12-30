/*!
 * appHelp v1.0
 *
 * Copyright 2010, Johannes Koggdal
 * http://koggdal.com/
 */
(function( window, document, undefined ) {
	
	var appHelp, $, Helpers, pointer_down = false;
	
	// Wrapper function to easily access helper functions
	// Uses the dollar sign. If you want to use jQuery or any other library that uses $,
	// use the full variable name (like jQuery instead of $) inside of this file
	appHelp = $ = function( selector ) {
		
		// Return a new instance of the Helpers object
		return new Helpers( selector );
	};
	
	// Constructor for the helper functions
	Helpers = function( selector ) {
		
		var elements;
		this.touch_enabled = undefined;
		this.animating = [];
		
		// Get the correct elements based on a CSS selector if argument is a string
		if( typeof selector === "string" ) {
			elements = this.nodeListToArray( document.querySelectorAll( selector ) );
		}
		
		// Get the elements from the selector if its an array
		else if( selector.length && selector.length > 0 ) {
			elements = selector;
		}
		
		// Get the element from the selector if its a single element
		else {
			elements = [selector];
		}
		
		// Set animation status to false for all elements
		for( var i = 0, l = elements.length; i < l; i++ )
			this.animating.push( false );
		
		// Assign the selected elements to the object
		if( elements !== null && elements !== undefined )
			this.elements = elements;
		
		// Return the object itself
		return this;
	};
	
	// Connect the helpers prototype to the appHelp class, to enable plugins to hook into the class
	Helpers.prototype = appHelp.fn = {
	
		// Function to get a specific element
		get: function( index ) {
			return this.elements[ index ];
		},
		
		// Function to find elements inside of the current element collection with a selector
		find: function( selector ) {
			
			var allElements = [];
			
			// Loop through all the selected elements
			for( var i = 0, l = this.elements.length; i < l; i++ ) {
				var elem = this.elements[ i ],
					newElements = this.nodeListToArray( elem.querySelectorAll( selector ) );
				
				allElements = allElements.concat( newElements );
			}
			
			return $( allElements );
		},
		
		// Function to convert a NodeList to an array
		nodeListToArray: function( nodeList ) {
			var ret = [];
			
			for( var i = 0, l = nodeList.length; i < l; i++ )
				ret.push( nodeList[ i ] );
			
			return ret;
		},
	
		// Function to make it easier to debug objects in mobile devices where dev tools arent available
		alert: function( obj ){
			var output = '';
			
			if( typeof obj === "object" && obj.nodeType === undefined ) {
				for(var x in obj){
					output += x+' : '+obj[x]+"\n";
				}
			} else if( typeof obj === "string" ) {
				output = obj;
			}
			
			alert(output);
		},
		
		// Function to bind events to selected elements
		bind: function( events_string, fn ) {
		
			// Loop through all the selected elements
			for( var n = 0, len = this.elements.length; n < len; n++ ) {
				var elem = this.elements[ n ];
				
				// Support multiple events in one string
				// Split the events and add the callback function for each event type
				var events = events_string.split( ' ' );
				for( var i = 0, l = events.length; i < l; i++ ){
				
					// Custom event that takes care of taps for touch devices
					// It behaves like click would on a desktop browser
					// The click event cant be used since its emulated and slow on mobile devices
					// This event uses touchstart/touchend for mobile devices and mousedown/mouseup for desktop
					// It will only trigger if the enter and leave events occur on the same element
					if( events[i] == "touchclick" ) {
					
						doc_pointerup = function( e ){
							// Prevent touch devices from trigger the emulated mouse event
							if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
								return false;
							
							pointer_down = false;
						};
						
						var _this = this,
							
							// Function triggered when touching starts / mouse button is pushes down
							start = function( e ) {
								// Prevent touch devices from trigger the emulated mouse event
								if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
									return false;
								
								pointer_down = true;
								
								
								
								if( elem !== document ) {
									// Add event handlers for the document which will trigger if the pointer is released outside of element
									document.addEventListener( 'touchend', doc_pointerup, false );
									document.addEventListener( 'mouseup', doc_pointerup, false );
								}
							},
							
							// Function triggered when touching ends / mouse button is released
							end = function( e, m ) {
								// Prevent touch devices from trigger the emulated mouse event
								if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
									return false;
								
								// Get pointer position and element position
								var pos = $.getPos( e, 0 ),
									dimensions = this === document ? {top:0,right:window.innerWidth,bottom:window.innerHeight,left:0} : this.getBoundingClientRect();
								
								// Check if pointer is down, and inside of the element
								if( pointer_down && pos.x >= dimensions.left && pos.x <= dimensions.right && pos.y > dimensions.top && pos.y < dimensions.bottom ) {
								
									if( elem !== document ) {
										// Unbind event handler on document
										document.removeEventListener( 'touchend', doc_pointerup, false );
										document.removeEventListener( 'mouseup', doc_pointerup, false );
									}
									
									pointer_down = false;
									
									// Trigger the user set callback method
									fn.call( this, e, m );
								}
							};
						
						// Bind event handlers to the element
						elem.addEventListener( 'touchstart', start, false );
						elem.addEventListener( 'mousedown', start, false );
						elem.addEventListener( 'touchend', (function( m ){ return function( e ){ end.call(this, e, m ) }; })(n), false );
						elem.addEventListener( 'mouseup', (function( m ){ return function( e ){ end.call(this, e, m ) }; })(n), false );
					} else {
					
						// Add the specified event handler
						elem.addEventListener( events[i], fn, false );
					}
				}
			}
				
			return this;
		},
		
		// Function to unbind events from selected elements
		unbind: function( events, fn ) {
		
			// Loop through all the selected elements
			for( var i = 0, l = this.elements.length; i < l; i++ ) {
				var elem = this.elements[ i ];
				
				// Support multiple events in one string
				// Split the events and remove the callback function for each event type
				events = events.split( ' ' );
				for( var i = 0, l = events.length; i < l; i++ )
					elem.removeEventListener( events[i], fn, false );
			}
			
			return this;
		},
		
		// Function to check for touch device
		isTouchDevice: function( e ) {
			if( this.touch_enabled === undefined || this.touch_enabled === false )
				this.touch_enabled = !!e.touches;
			
			return this.touch_enabled;
		},
		
		// Function to extend objects with new properties
		extend: function( target, obj ) {

			// Loop through all the properties and add them to the target object
			for( var property in obj ) {
				if( typeof obj[property] === "object" && obj[property].length === undefined && obj[property].nodeType === undefined )
					$.extend( target[property], obj[property] );
				else
					target[property] = obj[property];
			}
			
			return target;
		},
		
		// Function to find the current pointer position (both mouse and touch are supported)
		getPos: function( e, touchIndex, elem ){
			touchIndex = touchIndex || 0;
				
				// Get elements offset from the page edges
			var offset = elem ? elem.getBoundingClientRect() : ( this.elements ? this.elements[ 0 ].getBoundingClientRect() : {top:0,right:0,bottom:0,left:0} ),
				
				// The pointer position relative to the window
				pointer = {
					x: e.touches ? (e.touches.length > 0 ? e.touches[touchIndex].clientX : e.changedTouches[touchIndex].clientX ) : e.clientX,
					y: e.touches ? (e.touches.length > 0 ? e.touches[touchIndex].clientY : e.changedTouches[touchIndex].clientY ) : e.clientY,
				},
				
				// The scroll position
				scroll = {
					x: window.scrollX,
					y: window.scrollY
				},
				
				// The position within the element
				pos = {
					x: pointer.x - offset.left - scroll.x,
					y: pointer.y - offset.top - scroll.y
				};
			
			return pos;
		},
		
		// Function to see if an element is hidden or not
		// Selects first element if it is called on a collection of elements
		isHidden: function() {
			var elem = this.elements[ 0 ],
				style = window.getComputedStyle( elem, null ),
				visibility = style.getPropertyValue( 'visibility' ),
				display = style.getPropertyValue( 'display' );
			
			if( display == "none" || visibility == "hidden" )
				return true;
			else
				return false;
		},
		
		// Function to hide an element
		hide: function() {
		
			// Loop through all the selected elements
			for( var i = 0, l = this.elements.length; i < l; i++ ) {
				var elem = this.elements[ i ];
				
				if( elem.getAttribute( 'data-olddisplay' ) == "" )
					elem.setAttribute( 'data-olddisplay', elem.style.display == "" ? "block" : elem.style.display );
					
				elem.style.display = "none";
			}
			
			return this;
		},
		
		// Function to show an element
		show: function() {
		
			// Loop through all the selected elements
			for( var i = 0, l = this.elements.length; i < l; i++ ) {
				var elem = this.elements[ i ],
					
					oldBlock = elem.getAttribute( 'data-olddisplay' ) || "block";
					oldVisibility = elem.getAttribute( 'data-oldvisibility' ) || "visible";
				
				elem.style.display = oldBlock;
				elem.style.visibility = oldVisibility;
			}
			
			return this;
		},
		
		// Function to check if an element has a specific class
		// Selects first element if it is called on a collection of elements
		hasClass: function( className ) {
		
			var elem = this.elements[ 0 ];
			
			// Use native method if available
			if( elem.classList !== undefined ) {
				return elem.classList.contains( className );
			}
			
			// Emulate the native behaviour if not available
			else {
				if( ~(' '+elem.className+' ').indexOf( ' '+className+' ' ) )
					return true;
				else
					return false;
			}
		},
		
		// Function to add a class to an element
		addClass: function( className ) {
		
			// Loop through all the selected elements
			for( var i = 0, l = this.elements.length; i < l; i++ ) {
				var elem = this.elements[ i ];
			
				// Use native method if available
				if( elem.classList !== undefined ) {
					elem.classList.add( className );
				}
				
				// Emulate the native behaviour if not available
				else {
					var classes = elem.className;
					if( !~classes.indexOf( className ) )
						elem.className = classes.length > 0 ? classes+' '+className : className;
				}
			}
			
			return this;
		},
		
		// Function to remove a class from an element
		removeClass: function( className ) {
		
			// Loop through all the selected elements
			for( var i = 0, l = this.elements.length; i < l; i++ ) {
				var elem = this.elements[ i ];
		
				// Use native method if available
				if( elem.classList !== undefined ) {
					elem.classList.remove( className );
				}
				
				// Emulate the native behaviour if not available
				else {
					var classes = elem.className,
						regexp = new RegExp(className,"g");
					elem.className = classes.replace(regexp,'');
				}
			}
			
			return this;
		},
		
		// Function to remove elements from the DOM
		remove: function() {
			// Loop through all the selected elements
			for( var n = 0, len = this.elements.length; n < len; n++ ) {
				var elem = this.elements[ n ];
				
				elem.parentNode.removeChild( elem );
			}
		},
		
		// Function to get a specific computed style
		// Selects first element if it is called on a collection of elements
		getStyle: function( property ){
			var elem = this.elements[ 0 ];
			return window.getComputedStyle( elem, null ).getPropertyValue( property );
		},
		
		// Function to animate an elements CSS properties
		animate: function( parameters, duration, fps, callback ) {
		
			// Set default values if not passed to the function
			duration = duration || 1000;
			fps = fps || 30;
			callback = callback || function(){};
		
			// Loop through all the selected elements
			for( var n = 0, len = this.elements.length; n < len; n++ ) {
				var elem = this.elements[ n ];
		
				// Cancel animation if another animation is already running on this element
				// Will probably add some sort of animation queue later
				if( this.animating[ n ] )
					continue;
			
				// Variable declarations
				var _this = this,
					cssTransitionProperties = '',
					properties = [],
					endValues = [],
					startValues = [],
					changes = [],
					frames = Math.ceil(duration * ( fps / 1000 )),
					frame = 1,
					animation,
					
					// Boolean values to see if the browser supports CSS Transitions
					transition_webkit = elem.style.WebkitTransitionProperty !== undefined,
					transition_mozilla = elem.style.MozTransitionProperty !== undefined,
					transition_opera = elem.style.OTransitionProperty !== undefined,
					
					// Function that gets the unit for a specified property
					unit = function( property ) {
						var units = {
							opacity: '',
							_default: 'px'
						};
						
						if( units[property] !== undefined )
							return units[property];
						else
							return units._default;
					};
					
				// Loop through all the properties and save the values
				for( var property in parameters ) {
					cssTransitionProperties += property+', ';
					properties.push( property );
					endValues.push( parseFloat( parameters[ property ] ) );
					startValues.push( parseFloat( this.getStyle( property ) ) );
					changes.push( Math.round( ( endValues[ endValues.length-1 ] - startValues[ startValues.length-1 ] ) / frames * 100)/100 );
				}
				
				// Remove the last comma and space from the list of properties for CSS Transitions
				cssTransitionProperties = cssTransitionProperties.substring( 0, cssTransitionProperties.length-2 );
				
				// If the browser supports CSS Transitions
				if( transition_webkit || transition_mozilla || transition_opera ) {
				
					// Set transition for Webkit browsers
					if( transition_webkit ) {
						elem.style.WebkitTransitionProperty = cssTransitionProperties;
						elem.style.WebkitTransitionDuration = duration+"ms";
					}
					else
					// Set transition for Firefox 4 and up
					if( transition_mozilla ) {
						elem.style.MozTransitionProperty = cssTransitionProperties;
						elem.style.MozTransitionDuration = duration+"ms";
					}
					else
					// Set transition for Opera 10.50 and up
					if( transition_opera ) {
						elem.style.OTransitionProperty = cssTransitionProperties;
						elem.style.OTransitionDuration = duration+"ms";
					}
					
					// Set the end values for all the properties, and the browser will animate this change
					for( var i = 0, l = properties.length; i < l; i++ ) {
						elem.style[ properties[ i ] ] = endValues[ i ]+unit( properties[ i ] );
					}
					
					// Set animation status, to prevent other animations on the same element to interfere
					this.animating[ n ] = true;
					
					// Set up a timer to trigger ended() if the duration has passes
					var end_timer = setTimeout( function(){
							ended();
						}, duration );
					
					// Function that triggers on transition end
					var ended = (function( m ){ return function( e ) {
					
						// Set timer
						clearTimeout( end_timer );
					
						// Set animation status
						_this.animating[ m ] = false;
						
						// Unbind event handler
						$( elem ).unbind( 'webkitTransitionEnd oTransitionEnd transitionend', ended, false );
						
						// Trigger the callback
						callback();
					} })( n );
					
					// Bind event handler to reset the animation status on completion
					$( elem ).bind( 'webkitTransitionEnd oTransitionEnd transitionend', ended, false );
				}
				
				// If the browser doesnt support CSS Transitions, use a normal JavaScript animation
				else {
				
					this.animating[ n ] = true;
					
					// Function that sets the new value for all the properties
					animation = function( m ) {
						
						// Set new value for all properties
						for( var i = 0, l = properties.length; i < l; i++ )
							elem.style[ properties[ i ] ] = ( startValues[ i ] + changes[ i ] * frame )+unit(properties[i]);
						
						// Advance frame count
						frame++;
						
						// Trigger function again after a short delay if animation is not complete
						if( frame <= frames ) {
							setTimeout( animation, 1000 / fps, m );
						}
						
						// If animation is complete
						else {
						
							// Set the end value for all properties
							for( var i = 0, l = properties.length; i < l; i++ )
								elem.style[ properties[ i ] ] = ( endValues[ i ] )+unit(properties[i]);
							
							// Reset animation status
							_this.animating[ m ] = false;
							
							// Trigger the callback function
							callback();
						}
					};
					
					// Trigger the animation function to start the animation
					animation( n );
				}
			}
		},
		
		// Function for doing AJAX calls
		ajax: function( options ) {
		
			var settings = {
				url: '',
				data: '',
				type: 'GET',
				success: function(){},
				failure: function(){}
			};
			settings = $.extend( settings, options );
			
			var xhr = new XMLHttpRequest();
			if( settings.type == 'GET' ) {
				settings.data = settings.data.length > 0 ? '?'+settings.data : '';
				xhr.open( settings.type, settings.url+settings.data );
				xhr.send( null );
			} else {
				xhr.open( settings.type, settings.url );
				xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xhr.send( settings.data );
			}
			
			xhr.onreadystatechange = function() {
				if( this.readyState == 4 && this.status == 200 )
					settings.success( this.responseText );
				else if( this.readyState == 4 && this.status != 200 )
					settings.failure( this.status );
			};
		}
	};
	
	// Enable shorthands
	$.alert = Helpers.prototype.alert;
	$.isTouchDevice = Helpers.prototype.isTouchDevice;
	$.extend = Helpers.prototype.extend;
	$.getPos = Helpers.prototype.getPos;
	$.getStyle = Helpers.prototype.getStyle;
	$.ajax = Helpers.prototype.ajax;
	
	// Add the helper class to the global namespace in window
	window.appHelp = window.$ = appHelp;
	
})( window, window.document );