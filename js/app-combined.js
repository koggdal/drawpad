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





/*!
 * Slider v1.0
 * appHelp Plugin
 *
 * Copyright 2010, Johannes Koggdal
 * http://koggdal.com/
 */
(function( window, document, $, undefined ) {
	
	// Add the plugin to appHelp
	$.fn.slider = function( options ) {
	
		// Set default settings
		var settings = {
				min: 1,
				max: 10,
				start: 1,
				begin: function( newValue ){},
				change: function( newValue ){},
				end: function( newValue ){}
			},
			wrapper = this.get(0),
			bg = wrapper.firstElementChild,
			handle = bg.firstElementChild,
			bgWidth = parseInt(window.getComputedStyle( bg, null ).getPropertyValue( 'width' )),
			moving = false,
			mousemove,
			mouseup,
			currentValue,
			setNewValue;
		
		// Update settings with custom settings
		$.extend( settings, options );
		
		// Function to set a new value for the slider.
		// Sets the new handle position, updates the value and triggers the change callback
		setNewValue = function( e ) {
		
			// Triggered by event
			if( e.type === undefined ) {
			
				currentValue = ~~e;
				handle.style.left = Math.floor( currentValue / ( settings.max - settings.min ) * bgWidth )+'px';
			}
			
			// Triggered by code
			else {
			
				// Get left position
				var left = $.getPos( e, 0, bg ).x;
				
				
				// Set new position for the handle and set currentValue
				if( left <= 0 ) {
					handle.style.left = '0px';
					currentValue = settings.min;
				} else if( left > bgWidth ) {
					handle.style.left = bgWidth+'px';
					currentValue = settings.max;
				} else {
					handle.style.left = left+'px';
					currentValue = Math.ceil( left / bgWidth * ( settings.max - settings.min ) );
					if( currentValue <= settings.min )
						currentValue = settings.min;
					else if ( currentValue > settings.max )
						currentValue = settings.max;
				}
			}
			
			
			// Trigger the change method with the new value
			settings.change( currentValue );
		}
		
		// Set start value
		setNewValue( settings.start );
		
		// Function that is called continuosly during the dragging
		mousemove = function( e ) {
		
		
			// Prevent touch devices from trigger the emulated mouse event
			if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
				return false;
				
			if( moving ) {
				setNewValue( e );
			}
		};
		
		// Function that is called on mouseup
		mouseup = function( e ) {
			
			// Prevent touch devices from trigger the emulated mouse event
			if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
				return false;
			
			if( moving ) {
				moving = false;
				
				// Trigger end callback
				settings.end();
				
				// Unset the event handlers, to abort the dragging
				$( document )
				.unbind( 'touchmove mousemove', mousemove )
				.unbind( 'touchend mouseup', mouseup );
			}
		};
		
		// Set event handler for mousedown on the slider handle
		// This will start the dragging
		$( wrapper )
		.bind( 'touchstart mousedown', function( e ) {

			// Prevent touch devices from trigger the emulated mouse event
			if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
				return false;
		
			// Prevent original behaviour where the div is sometimes dragged away like an image
			e.preventDefault();
			
			// Set identifier
			id = e.touches ? e.touches[ e.touches.length-1 ].identifier : 'mouse';
			
			// Set moving state
			moving = true;
			
			// Trigger begin callback
			settings.begin();
			
			// Trigger new value
			setNewValue( e );
			
			
			// Set event handlers on the document element so you dont have to
			// keep the mouse pointer inside the slider handle
			$( document )
			.bind( 'touchmove mousemove', mousemove )
			.bind( 'touchend mouseup', mouseup );
		});
		
		// Return a function to enable updating the slider from outside
		return function( position ) {
			setNewValue( position );
		};
	};
	
})( window, window.document, appHelp );






/*!
 * ColorPicker v1.0
 * appHelp Plugin
 *
 * Copyright 2010, Johannes Koggdal
 * http://koggdal.com/
 */
(function( window, document, $, undefined ) {
	
	// Add the plugin to appHelp
	$.fn.colorPicker = function( options ) {
	
		// Set default settings
		var settings = {
				startValue: 175,
				addSwatch_cb: function( color ){},
				change: function( newValue ){}
			};
			
		// Update settings with custom settings
		$.extend( settings, options );
		
		var	currentBaseColor = {r:0,g:0,b:0},
			currentShadingPosition = {x:299,y:0},
			currentColor = {red:0,green:0,blue:0},
			currentSliderPosition = 1,
			colorspace = this.find( ".colorspace" ).get(0),
			colorspace_marker = this.find( ".colorspace .marker" ).get(0),
			spectrum = this.find( ".spectrum" ).get(0),
			addSwatch = this.find( ".add-swatch" ).get(0),
			width = parseInt( window.getComputedStyle( spectrum, null ).getPropertyValue( 'width' ) ),
			moving = false,
			addSwatch_down = false,
			addSwatch_docmouseup,
		
		
			// Function to get the color value of a specific position inside the color space
			getColorspaceValue = function( x, y, baseColor ){
			
				// Credit to Mark Kahn for explanation and code example
				// http://www.webreference.com/programming/javascript/mk/column3/2.html
		
				// Convert positions from the colorspace size to the color value size
				x = x / 299 * 255;
				y = y / 299 * 255;
				
					// White (horizontal, saturation) / black (vertical, lightness)
				var white = x / 255,
					black = 255 - y,
					
					// Percentages of base color
					red_percent = 1 - baseColor.red / 255,
					green_percent = 1 - baseColor.green / 255,
					blue_percent = 1 - baseColor.blue / 255,
					
					// Calculate new values
					r = Math.round( ( 1 - red_percent * white ) * black ),
					g = Math.round( ( 1 - green_percent * white ) * black ),
					b = Math.round( ( 1 - blue_percent * white ) * black );
					
				return { red: r, green: g, blue: b };
			},
			
			// Function to get the new color value and update
			updateColorShading = function( e ) {
			
				var pos, c;
			
				// Get position, either the saved value or the mouse position
				if( e === undefined )
					pos = currentShadingPosition;
				else
					pos = $.getPos( e, 0, colorspace );
					
				// Cancel update if pointer is outside of the color space
				// (touch devices seem to trigger this event even when touching outside)
				if( pos.x > 300 || pos.y > 300 || pos.x < 0 || pos.y < 0 )
					return false;
				
				// Set the marker to the current position
				colorspace_marker.style.left = pos.x+'px';
				colorspace_marker.style.top = pos.y+'px';
					
				// Get the color value for the current position
				c = getColorspaceValue( pos.x, pos.y, currentBaseColor );
					
				// Save the position to remember it when color is changed in the spectrum
				currentShadingPosition = { x: pos.x, y: pos.y };
				
				// Save and use the new color
				currentColor = { red: c.red, green: c.green, blue: c.blue };
				settings.change( currentColor );
			},
			
			// Function that is called continuosly during the dragging
			mousemove = function( e ) {
			
				// Prevent touch devices from trigger the emulated mouse event
				if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
					return false;
					
				if( moving ){
					// Update the color for the new position
					updateColorShading( e );
				}
			},
			
			// Function that is called on mouseup
			mouseup = function( e ) {
				// Prevent touch devices from trigger the emulated mouse event
				if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
					return false;
			
				if( moving ){
					// Set moving state
					moving = false;
					
					// Unset the event handler, to abort the dragging
					$( document ).unbind( 'touchend mouseup', mouseup );
				}
			};
		
			
		// Bind event handler for the color space
		$( colorspace ).bind( 'touchstart mousedown', function( e ) {
		
			// Prevent touch devices from trigger the emulated mouse event
			if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
				return false;
			
			// Prevent dragging the gradient image
			e.preventDefault();
			
			// Set moving state
			moving = true;
			
			// Update the color for the new position
			updateColorShading( e );

			// Set event handler for mouseup on the document element
			// so the dragging aborts if released outside the colorspace
			$( document ).bind( 'touchend mouseup', mouseup );
		})
		
		// Bind event handler to mousemove
		.bind( 'touchmove mousemove', mousemove );
		
		
		
		
		// Set up slider for color picker spectrum
		// (returns a function for updating the slider value)
		var updateSlider = $( spectrum ).slider({
			min: 1,
			max: 299,
			start: settings.startValue,
			change: function( pos ) {
			
				// Credit to Mark Kahn for explanation and code example
				// http://www.webreference.com/programming/javascript/mk/column3/2.html
				
					// Position, 1-299 (min to max assigned above)
				var i = pos,
				
					// Section width
					sW = width / 6,
					
					// Section number, 1-6
					sN = Math.ceil( pos / sW ),
					
					// Position in current section
					sP = i % sW, 
					
					// Color value used when value should increase
					vI = ( 255 / sW ) * sP,
					
					// Color value used when value should decrease
					vD = ( 255 - vI ), 
					
					// Red channel
					r = Math.round(
						i < sW ? 255 : // First section - full red
							i < sW * 2 ? vD : // Second section - decreasing red
								i < sW * 4 ? 0 : // Third and fourth section - no red
									i < sW * 5 ? vI : // Fifth section - increasing red
										255 // Sixth section - full red
					),
					
					// Green channel
					g = Math.round(
						i < sW ? vI : // First section - increasing green
							i < sW * 3 ? 255 : // Second and third section - full green
								i < sW * 4 ? vD : // Fourth section - decreasing green
									0 // Fifth and sixth section - no green
					),
					
					// Blue channel
					b = Math.round(
						i < sW * 2 ? 0 : // First and second section - no blue
							i < sW * 3 ? vI : // Third section - increasing blue
								i < sW * 5 ? 255 : // Fourth and fifth section - full blue
									vD // Sixth section - decreasing blue
					);
				
				// Save and use the new color
				currentSliderPosition = pos;
				currentBaseColor = { red: r, green: g, blue: b };
				colorspace.style.background = "rgb("+r+","+g+","+b+")";
				
				// Update with the new color, and use the current shading
				updateColorShading();
			}
		});
		
		
		
	
		
		// Bind event handler to add swatch button
		$( addSwatch ).bind( 'touchclick', function( e ){
		
				// Add the current color to the swatches
				settings.addSwatch_cb( currentColor, currentShadingPosition, currentBaseColor, currentSliderPosition );
		});
	
		// Return a function to enable updating the color picker from outside
		return function( shadingPosition, sliderPosition ){
			currentShadingPosition = shadingPosition;
			currentSliderPosition = sliderPosition;
			updateSlider( currentSliderPosition );
		};
	};
	
})( window, window.document, appHelp );





/*!
 * Draw v1.0
 * http://draw.koggdal.com/
 *
 * Copyright 2010, Johannes Koggdal
 * http://koggdal.com/
 */
(function( window, document, $, undefined ) {

	// Define the app class
	var Draw = function(){
		
		// Set default settings
		this.settings = {
			canvas: document.createElement( 'canvas' ),
			change: function(){},
			width: window.innerWidth,
			height: window.innerHeight,
			hideToolbars: function(){},
			showToolbars: function(){},
			toolbars_visible: false,
			historyLimit: 10,
			
			background: "#ffffff",
			density: 0.66,
			lineWidth: 2,
			strokeStyle: "#000000",
			fillStyle: "rgba(120,0,0,0.1)",
			opacity: 1,
			alpha: 1
		};
		
		
		// Add a history storage to enable undo/redo
		this.history = [];
		this.historyPos = 0;
		
		// Vars needed for the drawing process
		this.pointers = {};
		this.activePointers = 0;
		this.twofinger_tap = false;
	};
	
	// The member methods
	Draw.fn = Draw.prototype = {
	
		// Function to set up the canvas
		setup: function( options ){
			var _this = this;
			
			// Update the settings object with new values
			$.extend( this.settings, options );
			
			// Get the canvas used for drawing
			this.canvas = this.settings.canvas;
			
			// Get the drawing context used for drawing
			this.context = this.canvas.getContext( '2d' );
			
			// Set the image canvas
			this.canvasImage = document.createElement( 'canvas' );
			this.contextImage = this.canvasImage.getContext( '2d' );
			this.canvas.parentNode.insertBefore( this.canvasImage, this.canvas.nextElementSibling );
			
			// Set the canvas size to the size set in settings
			// Using a timer because iOS Safari doesnt load innerWidth/innerHeight (default size) correctly directly on load
			setTimeout( function() {
				_this.initDraw();
			}, 1 );
			
			// Cancel drawing process if mouse button is released outside of the canvas
			$( document ).bind( 'touchend mouseup' , function( e ){ _this.drawEnd( e ); } );
			
			// Bind touch and mouse events to the canvas
			$( this.canvas )
			.bind( 'touchstart mousedown', function( e ){ _this.drawStart( e ); } )
			.bind( 'touchmove mousemove', function( e ){ _this.drawMove( e ); } )
			.bind( 'touchend mouseup', function( e ){ _this.drawEnd( e ); } );
			
			// Clean up memory from all the data in the history object when user navigates away from the app
			$( window ).bind( 'unload', function() {
				_this.history = null;
			});
		},
		
		initDraw: function(){
			this.canvas.width = this.settings.width;
			this.canvas.height = this.settings.height;
			this.canvasImage.width = this.settings.width;
			this.canvasImage.height = this.settings.height;
			
			this.clear();
			this.reset();
		},
		
		// Function that starts the drawing process
		drawStart: function( e ) {

			// Prevent touch devices from trigger the emulated mouse event
			if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
				return false;
			
			
			// Cancel event if the mouse button is not the primary
			if( e.button && e.button !== 0 ){
				e.preventDefault();
				
				this.twofinger_tap = true;
				
				return false;
			}
				
			// Increase the number of active pointers (mouse down / touch press)
			this.activePointers++;
			
			// Loop through all the touch events (or one iteration for mouse down)
			for(var x = 0; x < (e.touches ? e.touches.length : 1); x++){
				// The touch identifier is used to distinguish the different touches
				var id = e.touches ? e.touches[x].identifier : 'mouse';
				
				// Add the pointer
				this.pointers[id] = {
					enabled: true,
					last: {
						x: $.getPos( e, x, this.canvas ).x,
						y: $.getPos( e, x, this.canvas ).y
					}
				};
			}
			
			if( e.touches && e.touches.length == 2 ) {
			
				this.twofinger_tap = true;
				
			} else {
			
				this.canvas.style.opacity = this.settings.opacity;
			
				// Loop through all the touch events (or one iteration for mouse down)
				for(var x = 0; x < (e.touches ? e.touches.length : 1); x++){
					this.context.beginPath();
					this.context.fillStyle = this.settings.fillStyle;
					this.context.arc(this.pointers[id].last.x,this.pointers[id].last.y,this.settings.lineWidth/2,0,Math.PI*2,false);
					this.context.fill();
					this.context.closePath();
				}
			}
		},
		
		// Function that draws the content when the pointer is moved
		drawMove: function( e ) {
		
			// Prevent touch devices from trigger the emulated mouse event
			if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
				return false;
		
			// Cancel event if the mouse button is not the primary, or if there are no active pointers
			if( e.button && e.button !== 0 || this.activePointers == 0 )
				return false;
				
			if( this.twofinger_tap )
				this.twofinger_tap = false;
			
			// Loop through the pointers
			var num_pointers = e.touches ? e.touches.length : 1;
			for(var i = 0; i < num_pointers; i++){
			
				// Get current pointer
				var id = e.touches ? e.touches[i].identifier : 'mouse',
					pointer = this.pointers[id];
				
				// Only try to draw if the current pointer is enabled
				if(pointer.enabled){
				
					// Calculate positions
					var pos = $.getPos( e, i, this.canvas ),
						last = pointer.last,
						dist = {
							x: pos.x - last.x,
							y: pos.y - last.y,
						},
						x = last.x,
						y = last.y,
						steps, step;
					dist.d = Math.sqrt(dist.x*dist.x + dist.y*dist.y);
					steps = dist.d*this.settings.density;
					step = 1 / steps;
					dist.x *= step;
					dist.y *= step;
					
					// Draw several times to fill in gaps between event triggerings
					for(var n = 0; n < steps; n++){
						this.context.beginPath();
						this.context.fillStyle = this.settings.fillStyle;
						this.context.arc(x,y,this.settings.lineWidth/2,0,Math.PI*2,false);
						this.context.fill();
						this.context.closePath();
						
						// Increment the x and y position for the next iteration
						x += dist.x;
						y += dist.y;
					}
					
					// Set the last drawn position of the current pointer
					this.pointers[id].last.x = pos.x;
					this.pointers[id].last.y = pos.y;
				}
			}
		},
		
		// Function that ends the drawing process
		drawEnd: function( e ) {
		
			var salt = Math.random();
			// Prevent touch devices from trigger the emulated mouse event
			if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
				return false;
		
			// Toggle the toolbars when canvas is tapped with two fingers / right clicked
			if( this.twofinger_tap ){
				if( this.settings.toolbars_visible ){
					this.settings.hideToolbars();
					this.settings.toolbars_visible = false;
				}else{
					this.settings.showToolbars();
					this.settings.toolbars_visible = true;
				}
				this.twofinger_tap = false;
				this.activePointers = 0;
				return false;
			}
			
			// Cancel event if the mouse button is not the primary, or if there are no active pointers
			if( e.button && e.button !== 0 || this.activePointers == 0 )
				return false;
				
			// Decrease the number of active pointers
			this.activePointers--;
			
			var ids = [];
			
			// Add all active identifiers to the ids array
			if( e.touches ) {
				for(var t = 0, len = e.touches.length; t < len; t++)
					ids.push(e.touches[t].identifier);
			} else {
				ids.push('mouse');
			}
			
			// Compare the IDs found in the pointers object against the ids array
			// If there is no match, the pointer is set to disabled
			for(var id in this.pointers){
				if(ids.indexOf(id) == -1)
					this.pointers[id].enabled = false;
			}
				
			// Move the drawn image to the primary canvas
			this.contextImage.globalAlpha = this.settings.opacity;
			this.contextImage.drawImage( this.canvas, 0, 0 );
			this.contextImage.globalAlpha = '1';
			
			// Clear the secondary canvas
			this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );
			this.canvas.style.opacity = '0';
			
			// Clear history states after the current position
			if( this.historyPos < this.history.length-1 ) {
				for( var i = this.historyPos+1, l = this.history.length; i < l; i++ )
					this.history.pop();
			}
			
			// Clear earlier history states if more than the limit
			if( this.history.length > this.settings.historyLimit ) {
				this.history.shift();
			}
			
			// Add to history
			this.history.push( this.contextImage.getImageData( 0, 0, this.canvasImage.width, this.canvasImage.height ) );
			this.historyPos = this.history.length-1;
			
			// Trigger change callback
			this.settings.change();
		},
		
		// Function to go back in history state
		undo: function() {
			// Clear the canvas
			this.contextImage.clearRect( 0, 0, this.canvasImage.width, this.canvasImage.height );
			// Add the image data from the previous state
			this.contextImage.putImageData( this.history[ --this.historyPos ], 0, 0 );
		},
		
		// Function to go forward in the history states
		redo: function() {
			// Clear the canvas
			this.contextImage.clearRect( 0, 0, this.canvasImage.width, this.canvasImage.height );
			// Add the image data from the previous state
			this.contextImage.putImageData( this.history[ ++this.historyPos ], 0, 0 );
		},
		
		// Function to reset the drawing process
		reset: function() {
			this.history = [];
			this.historyPos = 0;
			
			// Save first state to history
			this.history.push( this.contextImage.getImageData( 0, 0, this.canvasImage.width, this.canvasImage.height ) );
			
			// Update settings
			this.settings.change();
		},
		
		// Function to clear the entire canvas
		clear: function(){
		
			// Clear canvas
			this.contextImage.fillStyle = this.settings.background;
			this.contextImage.fillRect( 0, 0, this.settings.width, this.settings.height );
			
			// Save state to history
			this.history.push( this.contextImage.getImageData( 0, 0, this.canvasImage.width, this.canvasImage.height ) );
			
			// Update settings
			this.settings.change();
		},
		
		// Function to load an image into the canvas
		loadImage: function( url, x, y, reset, callback ) {
			reset = reset || false;
			var _this = this,
				img = document.createElement( 'img' );
			img.src = url;
			img.onload = function(){
			
				// Draw the image content onto the canvas
				_this.contextImage.drawImage( img, x, y );
				
				if( reset ) {
					// Reset the history
					_this.reset();
				} else {
				
					// Save state to history
					_this.history.push( _this.contextImage.getImageData( 0, 0, _this.canvasImage.width, _this.canvasImage.height ) );
				
					// Update settings
					_this.settings.change();
				}
				
				// Trigger callback function
				callback();
			};
		},
		
		// Function to get the color values
		getColorValues: function( color, format ) {
		
			// Get color from RGBA value
			if( format == "rgba" ) {
				var fill = color || this.settings.fillStyle,
					color_matches = /rgba\((\d+),(\d+),(\d+),(.*?)\)/.exec( fill ),
					
					colors = {
						red: parseInt(color_matches[1]),
						green: parseInt(color_matches[2]),
						blue: parseInt(color_matches[3]),
						alpha: parseFloat(color_matches[4])
					};
			}
			
			// Get color from RGB value
			if( format == "rgb" ) {
				var	color_matches = /rgb\((\d+),(\d+),(\d+)\)/.exec( color ),
					
					colors = {
						red: parseInt(color_matches[1]),
						green: parseInt(color_matches[2]),
						blue: parseInt(color_matches[3]),
						alpha: 1
					};
			}
			
			// Get color from hex value
			if( format == "hex" ) {
				var	color_matches = /#([A-Za-z0-9]{2})([A-Za-z0-9]{2})([A-Za-z0-9]{2})/.exec( color ),
					
					colors = {
						red: color_matches[1],
						green: color_matches[2],
						blue: color_matches[3],
						alpha: 1
					};
			}
				
			return colors;
		},
		
		// Convert between different color formats
		convertColorFormat: function( color, currentFormat, newFormat ) {
		
			// Convert rgba to hex
			if( currentFormat == "rgba" && newFormat == "hex" ) {
			
					// Function to convert one decimal value to hex (255 will translate to ff)
				var dec2hex = function( decValue ){
						var conversion = { 0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 10:'a', 11:'b', 12:'c', 13:'d', 14:'e', 15:'f' },
							hex_one = conversion[ Math.floor( decValue / 16 ) ],
							hex_two = conversion[ decValue % 16 ],
							hex = hex_one+''+hex_two;
						
						return hex;
					},
					
					// Get the different color channels from the passed color value
					colors = this.getColorValues( color, 'rgba' ),
					hex = {
						red: dec2hex( colors.red ),
						green: dec2hex( colors.green ),
						blue: dec2hex( colors.blue )
					};
				
				return "#"+hex.red+hex.green+hex.blue;
			}
			
			// Convert hex to rgba
			if( currentFormat == "hex" && newFormat == "rgba" ) {
			
					// Function to convert one hex value to dec (ff will translate to 255)
				var hex2dec = function( hexValue ){
						var conversion = { 0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 'a':10, 'b':11, 'c':12, 'd':13, 'e':14, 'f':15 },
							dec_one = conversion[ hexValue[0] ] * 16,
							dec_two = conversion[ hexValue[1] ],
							decVal = dec_one+dec_two;
							
						return decVal;
					},
					
					// Get the different color channels from the passed color value
					colors = this.getColorValues( color, 'hex' ),
					rgba = {
						red: hex2dec( colors.red ),
						green: hex2dec( colors.green ),
						blue: hex2dec( colors.blue ),
						alpha: colors.alpha
					};
				
				return "rgba("+rgba.red+","+rgba.green+","+rgba.blue+","+rgba.alpha+")";
			}
			
			// Convert rgb to rgba
			if( currentFormat == "rgb" && newFormat == "rgba" ) {
				
				// Get the different color channels from the passed color value
				var colors = this.getColorValues( color, 'rgb' );
				
				return "rgba("+colors.red+","+colors.green+","+colors.blue+","+colors.alpha+")";
			}
		},
		
		// Function to set the brush opacity
		setBrushOpacity: function( newOpacity ) {
			
			this.settings.opacity = newOpacity/100;
		},
		
		// Function to set the brush color. Accepts hex, rgb and rgba values
		setBrushColor: function( newColor ) {
			if( newColor.indexOf( '#' ) > -1 )
				newColor = this.convertColorFormat( newColor, 'hex', 'rgba' );
			else if( newColor.indexOf( 'rgb(' ) > -1 )
				newColor = this.convertColorFormat( newColor, 'rgb', 'rgba' );
				
			this.settings.fillStyle = newColor;
		},
		
		// Function to set a new brush size
		setBrushSize: function( newSize ) {
			this.settings.lineWidth = newSize;
			if( newSize == 1 )
				this.settings.density = 1;
			else
				this.settings.density = 0.66;
		}
		
	};
	
	
	// Add the app class to the global namespace in window
	window.Draw = Draw;
	
})( window, window.document, appHelp );





/*!
 * DrawApp v1.0
 * http://draw.koggdal.com/
 *
 * Copyright 2010, Johannes Koggdal
 * http://koggdal.com/
 */
(function( window, document, $, undefined ){

	// Prevent scrolling on mobile devices
	$( document ).bind( 'touchmove' , function( e ){ e.preventDefault(); } )
	
	// Prevent zoom on double tap on mobile devices
	$( document ).bind( 'touchstart' , function( e ){ e.preventDefault(); } )

		// Instantiate the Draw class
	var draw = new Draw(),
	
		// Get the GUI elements
		toolbar_top = $("#app_header"),
		toolbar_bottom = $("#app_footer"),
		editButton = $("#header_home .edit"),
		loginButton = $("#header_home .login"),
		loginBox = $("#home .login_box"),
		loginEmail = $("#home .login_box #email"),
		loginPass = $("#home .login_box #password"),
		loginSubmit = $("#home .login_box button"),
		doLogin,
		getServerImages,
		newImage = $("#home .new"),
		color = $("#color"),
		colorpicker = {
			wrapper: $("#colorpicker"),
			message: $("#colorpicker .message"),
			space: $("#colorpicker .colorspace"),
			spectrum: $("#colorpicker .spectrum"),
			addSwatch: $("#colorpicker .add-swatch")
		},
		swatches = $("#swatches .colorbox").elements,
		swatchStatuses = [],
		tempSwatchStatus = {},
		hideColorPickerMessage,
		slider_size = {
			wrapper: $("#size"),
			bg: $("#size .slider-bg"),
			handle: $("#size .slider-handle")
		},
		slider_size_update,
		slider_opacity = {
			wrapper: $("#opacity"),
			bg: $("#opacity .slider-bg"),
			handle: $("#opacity .slider-handle")
		},
		slider_opacity_update,
		button_home = $(".home"),
		button_undo = $(".undo"),
		button_redo = $(".redo"),
		button_save = $(".save"),
		save_box = $(".save_box"),
		historyStatesSinceSave = 0,
		button_save_local = $(".save_local"),
		button_save_cloud = $(".save_cloud"),
		button_save_cancel = $(".save_cancel"),
		button_cloud_register = $(".cloud_info .register_button"),
		button_cloud_login = $(".cloud_info .login_button"),
		button_cloud_back = $(".cloud_info .back_button"),
		button_reg_back = $(".cloud_register .back_button"),
		button_reg_register = $(".cloud_register .register_button"),
		button_login_back = $(".cloud_login .back_button"),
		button_login_login = $(".cloud_login .login_button"),
		is_submitting = false,
		cloudUserID = 0,
		thumbs = $("#home .grid .image"),
		thumbs_wrapper = $("#home .grid"),
		currentThumb = 1,
		serverImages = [],
		saveStatus = 'unsaved',
		saveGoToHome = false,
		saveToLocal,
		saveToCloud,
		createThumbnail,
		currentImage = 1,
		message = $("#draw .message"),
		showMessage,
		hideMessage,
		messageTimer,
		tooltipsWrapper = $("#draw .toolbar_wrapper"),
		brushSizeFeedback = $("#draw .brush_size"),
		initialized = false;
		
		
		// Functions called on initialization of the draw mode
		init = function() {
		
			// Set status for all swatches
			for( var i = 0; i < swatches.length; i++ ) {
				swatchStatuses.push(false);
			}
			
			// Set up the draw object
			draw.setup({
			
				// The canvas element
				canvas: $("#stage").get(0),
				
				// Callback fired when something is drawn to the canvas (after touchend/mouseup)
				change: function(){
					if( draw.history.length > 1 ) {
						button_undo.removeClass( 'disabled' );
						button_redo.addClass( 'disabled' );
						historyStatesSinceSave++;
					} else {
						button_undo.addClass( 'disabled' );
						button_redo.addClass( 'disabled' );
						historyStatesSinceSave = 0;
					}
				},
				
				// Set number of times you can undo
				historyLimit: 10,
				
				// Functions that hide and show the toolbars
				hideToolbars: function() {
					toolbar_top.hide();
					toolbar_bottom.hide();
				},
				showToolbars: function() {
					toolbar_top.show();
					toolbar_bottom.show();
				},
				toolbars_visible: true
			});
			
			// Set tooltip wrapper height ( window height - header height - footer height )
			tooltipsWrapper.get(0).style.height = ( window.innerHeight - 52 - 129 ) + 'px';
			
			// Function to set the brush color (both the current color swatch and the brush itself)
			var setColor = function( newColor ) {
				draw.setBrushColor( newColor );
				color.get(0).style.background = newColor;
				color.get(0).style.WebkitBackgroundClip = 'padding-box';
			};
			
			// Set up the color picker
			// (it returns a function for updating the color picker)
			var colorPickerUpdate = colorpicker.wrapper.colorPicker({
			
				// Set a start value for the spectrum (position in pixels)
				startValue: 170,
				
				// Callback fired when the color picker is updated
				change: function( color ) {
					setColor( "rgb("+color.red+","+color.green+","+color.blue+")" );
				},
				
				// Callback fired when hitting the Add Swatch button
				addSwatch_cb: function( color, shadingPosition, baseColor, sliderPosition ) {
				
					// Loop through all swatches
					for( var i = 0; i < swatches.length; i++ ) {
					
						// Find the first empty swatch
						if( swatchStatuses[i] === false ) {
						
							// Set the current color as the background color for this swatch
							swatches[i].style.background = 'rgb('+color.red+','+color.green+','+color.blue+')';
							swatches[i].style.WebkitBackgroundClip = 'padding-box';
							
							// Set the swatch status
							$( swatches[i] ).addClass( 'filled' );
							swatchStatuses[i] = {
								color: color,
								shadingPosition: shadingPosition,
								baseColor: baseColor,
								sliderPosition: sliderPosition
							};
							
							// Cancel the loop
							break;
							
						}
						
						// If it is the last iteration, and all swatches are filled
						else if( i == swatches.length -1 ) {
							
							// Show message about the swatches
							colorpicker.message.show();
							
							// Highlight the swatches
							for( var n = 0; n < swatches.length; n++ )
								$( swatches[n] ).addClass( 'highlighted' );
							
							// Save the color data in a temporary variable for access by other method
							tempSwatchStatus = {
								color: color,
								shadingPosition: shadingPosition,
								baseColor: baseColor,
								sliderPosition: sliderPosition
							};
							
							// Function to hide the message
							hideColorPickerMessage = function( e ){
							
								// Prevent touch devices from trigger the emulated mouse event
								if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
									return false;
									
								// Hide message about the swatches
								colorpicker.message.hide();
								
								// Remove the highlight on the swatches
								for( var n = 0; n < swatches.length; n++ )
									$( swatches[n] ).removeClass( 'highlighted' );
								
								// Remove this event handler
								$( document ).unbind( 'touchstart mousedown', hideColorPickerMessage );
							};
							
							// Add event handler for hiding the message when user taps anywhere on the screen
							$( document ).bind( 'touchstart mousedown', hideColorPickerMessage );
						}
					}
				}
			});
			
			// Bind event to brush color box
			color.bind( 'touchstart mousedown', function( e ) {
			
				// Prevent touch devices from trigger the emulated mouse event
				if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
					return false;
				
				// Toggle the color picker
				if( colorpicker.wrapper.isHidden() )
					colorpicker.wrapper.show();
				else
					colorpicker.wrapper.hide();
			});
			
			// Bind event to swatch boxes
			// Using CSS property pointer-events to disable non-filled swatches
			for( var i = 0; i < swatches.length; i++ ) {
				(function(n){		
					$( swatches[n] ).bind( 'touchstart mousedown', function( e ) {
					
						// Prevent touch devices from trigger the emulated mouse event
						if($.isTouchDevice( e ) && ~e.type.indexOf( 'mouse' ))
							return false;
						
						// If the swatch is highlighted (because all swatches are full)
						if( $( swatches[n] ).hasClass( 'highlighted' ) ) {
						
							// Set the current color as the background color for this swatch
							var color = tempSwatchStatus.color;
							swatches[n].style.background = 'rgb('+color.red+','+color.green+','+color.blue+')';
							swatches[n].style.WebkitBackgroundClip = 'padding-box';
							
							// Update the swatch status
							swatchStatuses[n] = tempSwatchStatus;
						}
						
						// If no highlight, update the color
						else {
							var swatch = swatchStatuses[n];
							colorPickerUpdate( swatch.shadingPosition, swatch.sliderPosition );
						}
					});
				})(i);
			}
			
			
			// Set up slider for brush size (returns an update method)
			slider_size_update = slider_size.wrapper.slider({
				min: 1,
				max: 50,
				start: 2,
				begin: function() {
					brushSizeFeedback.show();
				},
				change: function( newSize ) {
				
					// Set brush size
					draw.setBrushSize( newSize );
					
					// Show size feedback
					var circle = brushSizeFeedback.get(0);
					circle.style.width = newSize + 'px';
					circle.style.height = newSize + 'px';
					circle.style.top = ( ( window.innerHeight - 52 - 129 - newSize ) / 2 + 52 ) + 'px';
					circle.style.left = ( ( window.innerWidth - newSize ) / 2 ) + 'px';
					circle.style.background = draw.settings.fillStyle;
				},
				end: function() {
					brushSizeFeedback.hide();
				}
			});
			
			// Set up slider for brush opacity (returns an update method)
			slider_opacity_update = slider_opacity.wrapper.slider({
				min: 0,
				max: 100,
				start: 100,
				begin: function(){
					brushSizeFeedback.show();
				},
				change: function( newOpacity ) {
					draw.setBrushOpacity( newOpacity );
					brushSizeFeedback.get(0).style.background = draw.settings.fillStyle;
					brushSizeFeedback.get(0).style.WebkitBackgroundClip = 'padding-box';
					brushSizeFeedback.get(0).style.opacity = draw.settings.opacity;
				},
				end: function(){
					brushSizeFeedback.hide();
				},
			});
			
			// Bind event handler to home button
			button_home.bind( 'touchclick', function( e ) {
			
				// Hide old message
				clearTimeout( messageTimer );
				message.get(0).style.display = 'none';
				message.get(0).style.opacity = '0';
				
				// If something is changed
				if( historyStatesSinceSave > 0 ) {
					
					// Show question
					showMessage( 'Image has changed<br /><button type="button" class="save_yes">Save</button><button type="button" class="save_no">Don\'t save</button>' );
					
					// Bind event handler to Save button
					$("#app_content .message .save_yes").bind( 'touchclick', function(){
					
						// Hide message
						hideMessage();
						
						// Set variable to let the save box know that the user wants to go Home
						saveGoToHome = true;
						
						// Show the save box
						save_box.animate( { bottom: 0 }, 200, 30 );
					});
					
					// Bind event handler to Dont save button
					$("#app_content .message .save_no").bind( 'touchclick', function(){
					
						// Hide message
						hideMessage();
						
						// Update the thumbnails
						setThumbnails();
						
						// Set the app mode
						document.body.setAttribute( 'id', 'mode_home' );
					});
				}
				
				// If nothing is changed
				else {
					// Update the thumbnails
					setThumbnails();
					
					// Set the app mode
					document.body.setAttribute( 'id', 'mode_home' );
				}				
			});
			
			// Bind event handler to undo button
			button_undo.bind( 'touchclick', function( e ) {
				draw.undo();
				if( draw.historyPos == 0 )
					button_undo.addClass( 'disabled' );
				
				button_redo.removeClass( 'disabled' );
			});
			
			// Bind event handler to redo button
			button_redo.bind( 'touchclick', function( e ) {
				draw.redo();
				if( draw.historyPos == draw.history.length-1  )
					button_redo.addClass( 'disabled' );
				
				button_undo.removeClass( 'disabled' );
			});
			
			var doc_down, box_down;
			// Bind event handler to save button
			button_save.bind( 'touchclick', function( e ) {
				save_box.animate( { bottom: 0 }, 200, 30 );
			});
			
			// Bind event handler to local save button
			button_save_local.bind( 'touchclick', function( e ) {
			
				// Hide the box
				save_box.animate( { bottom: -1*parseInt(save_box.getStyle( 'height' )) }, 200, 30 );
				
				// Save
				if( saveStatus == 'unsaved' )
					saveToLocal();
				else
					saveToLocal( currentImage );
				
				// Show save message
				showMessage( '<h2>Image saved</h2>to browser storage', 1500 );
			});
			
			// Bind event handler to cloud save button
			button_save_cloud.bind( 'touchclick', function( e ) {
			
				if( cloudUserID > 0 ) {
				
					if( is_submitting )
						return false;
				
					is_submitting = true;
					
					// Set new button text
					var oldText = button_save_cloud.get(0).innerHTML;
					button_save_cloud.addClass( 'disabled' ).get(0).innerHTML = 'Processing...';
				
				
					// Save image to app server
					saveToCloud( cloudUserID, function() {
					
						getServerImages( cloudUserID, function() {
						
							is_submitting = false;
							
							// Reset the button text
							button_save_cloud.removeClass( 'disabled' ).get(0).innerHTML = oldText;
						
							// Hide the save box
							save_box.animate( { bottom: -1*parseInt(save_box.getStyle( 'height' )) }, 200, 30 );
							
							// Show save message
							showMessage( '<h2>Image saved</h2>to cloud storage', 1500 );
						});
					});
				} else {
				
					// Switch view
					save_box.find(".save_choices").hide();
					save_box.find(".cloud_info").show();
				}
			});
			
			// Bind event handler to the back button in the registration form
			button_cloud_back.bind( 'touchclick', function( e ) {
			
				save_box.find(".cloud_info").hide();
				save_box.find(".save_choices").show();
			});
			
			// Bind event handler to the back button in the registration form
			button_cloud_register.bind( 'touchclick', function( e ) {
			
				save_box.find(".cloud_info").hide();
				save_box.find(".cloud_register").show();
			});
			
			// Bind event handler to the back button in the registration form
			button_reg_back.bind( 'touchclick', function( e ) {
			
				save_box.find(".cloud_register").hide();
				save_box.find(".cloud_info").show();
			});
			
			
			// Handle how the login form is submitted
			$(".cloud_register").find("input, .register_button").bind( 'keypress touchclick click', function( e ) {
			
				// Prevent click from submitting the form (special event touchclick takes care of submitting)
				if( e.type == 'click' ) {
					e.preventDefault();
				} else
				
				if( // Enter key in input field
					( this.nodeName == 'INPUT' && e.type == 'keypress' && ( e.keyCode == 13 || e.which == 13 ) )
					||
					// Click / tap on button
					( this.nodeName == 'BUTTON' && e.type != 'keypress' )
				  ) {
				
					// Prevent form from being submitted
					e.preventDefault();
			
					// Get elements
					var label_email = save_box.find("label[for=reg_email]").get(0),
						label_pass_1 = save_box.find("label[for=reg_password_1]").get(0),
						label_pass_2 = save_box.find("label[for=reg_password_2]").get(0),
						email = save_box.find("#reg_email").get(0),
						pass_1 = save_box.find("#reg_password_1").get(0),
						pass_2 = save_box.find("#reg_password_2").get(0),
						
						errors = 0;
					
					// Reset labels
					label_email.innerHTML = 'E-mail';
					label_pass_1.innerHTML = 'Password';
					label_pass_2.innerHTML = 'Password again';
				
					// Validate e-mail
					if( /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i.test( email.value ) === false ) {
						label_email.innerHTML = 'E-mail - <b>Incorrect address</b>';
						errors++;
					}
					
					// Validate password length
					if( pass_1.value.length < 6 ) {
						label_pass_1.innerHTML = 'Password - <b>Too short</b>';
						errors++;
					}
					
					// Validate if passwords match
					if( pass_1.value != pass_2.value ) {
						label_pass_2.innerHTML = 'Password again - <b>Does not match</b>';
						errors++;
					}
					
					// Go on with registration if no errors occured
					if( errors == 0 ) {
					
						// Prevent double submission
						if( is_submitting )
							return false;
						
						is_submitting = true;
						
						$.ajax({
							url: '../register/',
							data: 'email='+email.value+'&password='+pass_1.value,
							type: 'POST',
							success: function( response ){
								var data = JSON.parse( response );
								
								// User was registered successfully
								if( data.status == "ok" ) {
								
									// Save
									saveToCloud( data.user.id, function(){
								
										// Login
										doLogin( 'save_register', function( userID ) {
											
											// Hide the save box
											save_box.animate( { bottom: -1*parseInt(save_box.getStyle( 'height' )) }, 200, 30, function() {
												email.value = '';
												pass_1.value = '';
												pass_2.value = '';
												save_box.find(".cloud_register").hide();
												save_box.find(".save_choices").show();
												is_submitting = false;
											});
											
											// Scroll to the top
											$("#app_header").get(0).scrollIntoView();
											
											// Remove focus from input fields (remove keyboard on iOS)
											email.blur();
											pass_1.blur();
											pass_2.blur();
											
											// Show save message
											showMessage( '<h2>Image saved</h2>to cloud storage', 1500 );
										});
										
									});
								}
								
								// The e-mail already exists in the database
								else if( data.status == "email-exists" ) {
									
									label_email.innerHTML = 'E-mail - <b>Already exists in database</b>';
									is_submitting = false;
								}
							}
						});
					}
				}
			});
			
			// Bind event handler to the back button in the registration form
			button_cloud_login.bind( 'touchclick', function( e ) {
			
				save_box.find(".cloud_info").hide();
				save_box.find(".cloud_login").show();
			});
			
			// Bind event handler to the back button in the registration form
			button_login_back.bind( 'touchclick', function( e ) {
			
				save_box.find(".cloud_login").hide();
				save_box.find(".cloud_info").show();
			});
			
					// Handle how the login form is submitted
			$(".cloud_login").find("input, .login_button").bind( 'keypress touchclick click', function( e ) {
			
				// Prevent click from submitting the form (special event touchclick takes care of submitting)
				if( e.type == 'click' ) {
					e.preventDefault();
				} else
				
				if( // Enter key in input field
					( this.nodeName == 'INPUT' && e.type == 'keypress' && ( e.keyCode == 13 || e.which == 13 ) )
					||
					// Click / tap on button
					( this.nodeName == 'BUTTON' && e.type != 'keypress' )
				  ) {
				
					// Prevent form from being submitted
					e.preventDefault();
					
					// Prevent double submission
					if( is_submitting )
						return false;
					
					is_submitting = true;
					
					// Login
					doLogin( 'save_login', function( userID ) {
					
						saveToCloud( userID, function(){
							getServerImages( userID, function() {
							
								// Hide the save box
								save_box.animate( { bottom: -1*parseInt(save_box.getStyle( 'height' )) }, 200, 30, function() {
									save_box.find(".cloud_login").hide();
									save_box.find(".save_choices").show();
									is_submitting = false;
								});
								
								// Show save message
								showMessage( '<h2>Image saved</h2>to cloud storage', 1500 );
							});
						});
					});
				}
			});
			
			// Bind event handler to cancel save button
			button_save_cancel.bind( 'touchclick', function( e ) {
				$( document ).unbind( 'touchstart mousedown', doc_down );
				save_box.unbind( 'touchstart mousedown', box_down );
				save_box.animate( { bottom: -1*parseInt(save_box.getStyle( 'height' )) }, 200, 30 );
			});
			
			// Bind event handler to document to be able to hide tooltips on tap
			$( document ).bind( 'touchstart mousedown', function( e ) {
			
				// Hide the tooltips
				tooltipsWrapper.hide();
			});
			
			initialized = true;
		};
	
	
	// Function to show a message for a short while
	showMessage = function( text, duration ){
	
		var fade_time = 300;
	
		if( duration == 'no-animation' ) {
			fade_time = 0;
			duration = undefined;
		}
	
		// Get the element
		var elem = message.get(0);
		
		// Set the text
		elem.innerHTML = text;
		
		// Set display to block to enable the message
		elem.style.opacity = '0';
		elem.style.display = 'block';
	
		// Set the position
		elem.style.left = (
			(
				window.innerWidth - parseInt( message.getStyle( 'width' ) )  // window width - message width
				-
				parseInt( message.getStyle( 'padding-left' ) ) // - padding-left
				-
				parseInt( message.getStyle( 'padding-right' ) ) // - padding-right
			) / 2 // Divide the total space to the sides in two to calculate the left position
		)+'px';
		
		if( fade_time > 0 ) {
			// Animate the opacity to 1 (fully visible)
			message.animate( { opacity: 1 }, fade_time, 30, function() {

				if( duration !== undefined ) {
					// Start the timer when the message is fully visible
					messageTimer = setTimeout( function() {
						hideMessage();
					}, duration );
				}
			});
		} else {
			elem.style.opacity = '1';
			if( duration !== undefined ) {
				// Start the timer when the message is fully visible
				messageTimer = setTimeout( function() {
					hideMessage();
				}, duration );
			}
		}
	};
	
	// Function to hide a message if no duration was passed
	hideMessage = function() {
		
		// Animate the opacity to 0 (invisible)
		message.animate( { opacity: 0 }, 500, 30, function() {
		
			// Set display to none to disable the message
			message.get(0).style.display = 'none';
		});
	};
	
	// Function to create a thumbnail of the current image
	createThumbnail = function( format ) {
	
		// Create the temp canvas
		var tmpCanvas = document.createElement('canvas'),
			tmpContext = tmpCanvas.getContext('2d'),
			
			// Get dimensions
			size = draw.canvas.width > draw.canvas.height ? draw.canvas.height : draw.canvas.width,
			offset = Math.abs( draw.canvas.width - draw.canvas.height ) / 2,
			offset_x = draw.canvas.width > draw.canvas.height ? offset : 0,
			offset_y = draw.canvas.width > draw.canvas.height ? 0 : offset;
		
		// Set thumb size
		tmpCanvas.width = 88;
		tmpCanvas.height = 88;
		
		// Create the thumbnail
		tmpContext.drawImage( draw.canvasImage, offset_x, offset_y, size, size, 0, 0, 88, 88 );
		
		if( format == "data_url" )
			return tmpCanvas.toDataURL();
		else
			return tmpCanvas;
	};
	
	// Save image to local storage
	saveToLocal = function( id ) {
	
		// Get ID from local storage if not present as argument
		if( id === undefined ) {
			id = ~~window.localStorage.getItem( 'last_id' )+1;
			window.localStorage.setItem( 'last_id', id );
		}
		
		// Save to local storage
		window.localStorage.setItem( 'image_' + id, draw.canvasImage.toDataURL() );
		window.localStorage.setItem( 'thumb_' + id, createThumbnail( 'data_url' ) );
		
		
		// Set save status
		saveStatus = 'saved';
		
		// Reset number of history states since save
		historyStatesSinceSave = 0;
		
		if( saveGoToHome ) {
		
			// Reset var
			saveGoToHome = false;
			
			// Update the thumbnails
			setThumbnails();
			
			// Set the app mode
			document.body.setAttribute( 'id', 'mode_home' );
		}
	};
	
	// Save image to app server
	saveToCloud = function( user_id, callback ) {
	
		callback = callback || function(){};
	
		$.ajax({
			url: '../cloud-save/',
			data: 'user_id='+user_id+'&fullsize='+draw.canvasImage.toDataURL()+'&thumb='+createThumbnail( 'data_url' ),
			type: 'POST',
			success: function( response ){
				var data = JSON.parse( response );
				
				// Set save status
				saveStatus = 'saved';
				
				// Reset number of history states since save
				historyStatesSinceSave = 0;
				
				if( saveGoToHome ) {
				
					// Reset var
					saveGoToHome = false;
					
					// Update the thumbnails
					setThumbnails();
					
					// Set the app mode
					document.body.setAttribute( 'id', 'mode_home' );
				}
				
				callback();
			}
		});
	};
	
	
	// Bind event handler to the edit button
	editButton.bind( 'touchclick', function() {
		var btn = editButton.get(0);
		
		if( btn.innerHTML == 'Edit' ) {
			
			// Change button state
			btn.innerHTML = 'Done';
			
			// Hide login button
			loginButton.hide();
			
			// Set delete icon
			thumbs.addClass( 'delete' );
		} else
		
		if( btn.innerHTML == 'Done' ) {
		
			// Change button state
			btn.innerHTML = 'Edit';
			
			// Show login button
			loginButton.show();
			
			// Set delete icon
			thumbs.removeClass( 'delete' );
		}
	});
	
	// Bind event handler to the login button
	loginButton.bind( 'touchclick', function() {
		var top = parseInt( loginBox.getStyle( 'top' ) );
		if( top < 0 ){
		
			if( loginButton.get(0).innerHTML == 'Log out' ) {
			
				$.ajax({
					url: '../logout/',
					type: 'POST',
					success: function(){
						loginButton.get(0).innerHTML = 'Log in';
						serverImages = [];
						setThumbnails();
						cloudUserID = 0;

						if( $("#home .grid .active:not(.new)").elements.length == 0 ) {
							editButton.hide();
							thumbs.removeClass( 'delete' );
						}
					}
				});
			
			} else {
			
				// Prefill the email field if it is already saved
				loginEmail.get(0).value = window.localStorage.getItem( 'login_email' );
		
				// Show box
				loginBox.animate( { top: 0 }, 200, 30 );
				
				// Hide edit button
				editButton.hide();
				
				// Set button text
				loginButton.get(0).innerHTML = "Cancel";
			}
			
		} else {
		
			// Hide box
			loginBox.animate( { top: -1*parseInt( loginBox.getStyle( 'height' )) }, 200, 30 );
			
			// Show edit button
			editButton.show();
			
			// Remove focus from input fields
			loginBox.find("input").get(0).blur();
			loginBox.find("input").get(1).blur();
			
			// Set button text
			loginButton.get(0).innerHTML = "Log in";
		}
	});
	
	var stopScroll = false;
	
	// Scroll to the top when password box loses focus (iOS scrolls when input fields are focused)
	$(".login_box input, .cloud_login input").bind( 'blur', function() {
		stopScroll = false;
		setTimeout(function(){
			if( !stopScroll ) {
				$("#app_header").get(0).scrollIntoView();
			}
		},10);
	});
	$(".login_box input, .cloud_login input").bind( 'focus', function() {
		stopScroll = true;
	});
	
	getServerImages = function( userID, callback ) {
	
		callback = callback || function(){};
		
		// Send AJAX request to server to fetch images
		$.ajax({
			url: '../cloud-images/',
			data: 'user_id='+userID,
			type: 'GET',
			success: function( response ) {
				var data = JSON.parse( response );
				
				// Images are found
				if( data.status == "ok" ) {
				
					serverImages = [];
				
					// Loop images
					for( var i = 0, images = data.images, l = images.length; i < l; i++ ) {
						serverImages.push( images[ i ] );
					}
					setThumbnails();
					
					callback();
				}
			}
		});
	};
	
	// Function that handles the login procedure
	doLogin = function( origin, callback ) {
	
		callback = callback || function(){};
	
		var label_email = ( origin == "save_login" ) ? save_box.find("label[for=login_email]").get(0) : ( ( origin == "save_register" ) ? save_box.find("label[for=reg_email]").get(0) : loginBox.find("label[for=email]").get(0) ),
			label_password = ( origin == "save_login" ) ? save_box.find("label[for=login_password]").get(0) : ( ( origin == "save_register" ) ? save_box.find("label[for=reg_password_1]").get(0) : loginBox.find("label[for=password]").get(0) ),
			email = ( origin == "save_login" ) ? save_box.find("#login_email").get(0) : ( ( origin == "save_register" ) ? save_box.find("#reg_email").get(0) : loginEmail.get(0) ),
			password = ( origin == "save_login" ) ? save_box.find("#login_password").get(0) : ( ( origin == "save_register" ) ? save_box.find("#reg_password_1").get(0) : loginPass.get(0) ),
			login_button = ( origin == "save_login" ) ? button_login_login : ( ( origin == "save_register" ) ? button_reg_register : false ),
			back_button = ( origin == "save_login" ) ? button_login_back : ( ( origin == "save_register" ) ? button_reg_back : false );
		
		// Set button status
		if( login_button !== false ){
			var oldText = login_button.get(0).innerHTML;
			login_button.addClass( 'disabled' ).get(0).innerHTML = 'Processing...';
			back_button.addClass( 'disabled' );
		}
		
		// Send AJAX request to server to try to login
		$.ajax({
			url: '../login/',
			data: 'email='+email.value+'&password='+password.value,
			type: 'POST',
			success: function( response ) {
				var data = JSON.parse( response ),
					userID = data.user ? data.user.id : 0;
				
				// Reset labels
				label_email.innerHTML = 'E-mail';
				label_password.innerHTML = 'Password';
				
				// Login was correct
				if( data.status == "ok" ) {
				
					// Save email in local storage to remember it for next app start
					window.localStorage.setItem( 'login_email', data.user.email );
				
					// Set button text
					loginButton.get(0).innerHTML = "Log out";
					
					// Set user ID
					cloudUserID = data.user.id;
					
					if( origin == "header" ) {
					
						// Hide box
						loginBox.animate( { top: -1*parseInt( loginBox.getStyle( 'height' )) }, 200, 30 );
					}
					
					// Empty the login fields
					password.value = '';
					
					// Set focus
					email.blur();
					password.blur();
					
					// Get thumbnails
					getServerImages( data.user.id, function() {
					
						// Set button status
						if( login_button !== false ){
							login_button.removeClass( 'disabled' ).get(0).innerHTML = oldText;
							back_button.removeClass( 'disabled' );
						}
						
						// Show edit button
						if( $("#home .grid .active:not(.new)").elements.length > 0 ) {
							editButton.show();
						}
						
						callback( data.user.id );
					});
				}
				
				// E-mail failed
				else if( data.status == "wrong-email" ) {
					label_email.innerHTML = 'E-mail - <b>Address not found</b>';
					label_email.scrollIntoView(false);
					
					// Set button status
					if( login_button !== false ){
						login_button.removeClass( 'disabled' ).get(0).innerHTML = oldText;
						back_button.removeClass( 'disabled' );
					}
				}
				
				// Password failed
				else if( data.status == "wrong-password" ) {
					label_password.innerHTML = 'Password - <b>Not correct</b>';
					
					// Set button status
					if( login_button !== false ){
						login_button.removeClass( 'disabled' ).get(0).innerHTML = oldText;
						back_button.removeClass( 'disabled' );
					}
				}
			}
		});
	};
	
	// Handle how the login form is submitted
	loginBox.find("input, button").bind( 'keypress touchclick click', function( e ) {
	
		// Prevent click from submitting the form
		if( e.type == 'click' ) {
			e.preventDefault();
		}
		
		else
	
		
		if( // Enter key in input field
			( this.nodeName == 'INPUT' && e.type == 'keypress' && ( e.keyCode == 13 || e.which == 13 ) )
			||
			// Click / tap on button
			( this.nodeName == 'BUTTON' && e.type != 'keypress' )
		) {
		
			// Prevent form from being submitted
			e.preventDefault();
		
			// Login
			doLogin( 'header' );
		}
	});
	
	
	// Bind event handler to the new image button
	newImage.bind( 'touchclick', function( e ) {
	
		// Set canvas to full window size
		var canvas = $("#stage").get(0);
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	
		// Set app mode to draw
		document.body.setAttribute( 'id', 'mode_draw' );
		
		// Initialize the draw mode if not done already
		if( !initialized )
			init();
			
		// Clear the canvas
		draw.clear();
		draw.reset();
		
		// Reset sliders
		slider_size_update( 2 );
		slider_opacity_update( 100 );
		
		// Hide login box if it is visible
		loginBox.animate( { top: -1*parseInt( loginBox.getStyle( 'height' )) }, 200, 30 );
		editButton.show();
		
		// Set save status
		saveStatus = 'unsaved';
		
		// Show the tooltips
		tooltipsWrapper.show();
	});
	
	
	// Function triggered when a thumb is clicked
	var thumb_click = function( e ) {
	
		// Filter out the new button and empty cells
		if( $( this ).hasClass( 'new' ) || !$( this ).hasClass( 'active' ) )
			return false;
		
		// Delete
		if( $( this ).hasClass( 'delete' ) ) {
		
			// Get id
			var id = this.getAttribute( "data-id" ),
				source = this.getAttribute( "data-source" );
			
			// Remove image data from local storage
			if( source == "local" ) {
				window.localStorage.removeItem('image_'+id);
				window.localStorage.removeItem('thumb_'+id);
				
				// Reset last image id if this is the last image
				if( window.localStorage.getItem( 'last_id' ) == id ){
					var nextID = this.nextElementSibling.getAttribute( "data-id" );
					window.localStorage.setItem( 'last_id', nextID );
				}
				
				setThumbnails();
				
				// Set edit button visibility and remove delete icon
				if( $("#home .grid .active:not(.new)").elements.length == 0 ) {
					editButton.hide();
					editButton.get(0).innerHTML = 'Edit';
					loginButton.show();
					thumbs.removeClass( 'delete' );
				}
			}
			
			// Remove image data from local storage
			else if( source == "server" ) {
				$.ajax({
					url: '../cloud-delete/',
					data: 'user_id='+cloudUserID+'&image_id='+id,
					type: 'POST',
					success: function() {
						getServerImages( cloudUserID, function(){
							setThumbnails();
							
							// Set edit button visibility
							if( $("#home .grid .active:not(.new)").elements.length == 0 ) {
								editButton.hide();
								editButton.get(0).innerHTML = 'Edit';
								loginButton.show();
								thumbs.removeClass( 'delete' );
							}
						});
					}
				});
			}
		} else {
			
			// Set app mode to draw
			document.body.setAttribute( 'id', 'mode_draw' );
			
			// Initialize the draw mode if not done already
			if( !initialized )
				init();
				
			// Hide login box if it is visible
			loginBox.animate( { top: -1*parseInt( loginBox.getStyle( 'height' )) }, 200, 30 );
			editButton.show();
			
			// Show loading message
			showMessage( 'Loading image...', 'no-animation' );
			
			// Get image data from local storage
			if( this.getAttribute( "data-source" ) == "local" ) {
				// Get image data
				var id = this.getAttribute( "data-id" ),
					dataURL = window.localStorage.getItem('image_'+id);
			}
			
			// Get image data from the server variable
			else if( this.getAttribute( "data-source" ) == "server" ) {
				var id = this.getAttribute( "data-index" ),
					dataURL = serverImages[ id ].fullsize;
			}
			
			// Open the image
			draw.clear();
			draw.loadImage( dataURL, 0, 0, true, function(){
				hideMessage();
			});
			
			// Set save status
			saveStatus = 'saved';
			
			// Set current image
			currentImage = id;
			
			// Hide the tooltips
			tooltipsWrapper.hide();
		}
	};
	
	// Bind event handler to the thumbnails
	thumbs.bind( 'touchclick', thumb_click );
	
	
		// Function to set the new thumbnail style
	var setThumbnailStyle = function( index, dataURL, id, type, i ) {
	
		i = i || ( i == 0 ? 0 : '');
		
		// Set the background of the thumbnail box
		thumbs.elements[ index ].style.background = dataURL.length > 0 ? "url('"+dataURL+"')" : '';
		thumbs.elements[ index ].style.WebkitBackgroundClip = 'padding-box';
		if( dataURL.length > 0 )
			$( thumbs.elements[ index ] ).addClass( "active" );
		else
			$( thumbs.elements[ index ] ).removeClass( "active" );
		thumbs.elements[ index ].setAttribute( "data-id", id );
		thumbs.elements[ index ].setAttribute( "data-index", i );
		thumbs.elements[ index ].setAttribute( "data-source", type );
	};
	
	
		// Function to set thumbnail
	var	setThumbnail = function( type, id, index ) {
	
			index = index || ( index == 0 ? 0 : '' );
	
			// Set edit button visibility
			if( editButton.hasClass( 'hidden' ) )
				editButton.removeClass( 'hidden' );
		
			// Get image from local storage
			if( type == "local" ) {
			
				// Get the base64 encoded data url from the local storage
				var dataURL = window.localStorage.getItem( 'thumb_' + id );
				
				// If it is set and actually is a data url
				if( dataURL !== null && ~dataURL.indexOf( 'data:' ) ) {
					setThumbnailStyle( currentThumb, dataURL, id, type );
					
					// Increment box index
					currentThumb++;
				}
			}
			
			// Get image from server
			else if ( type == "server" ) {
			
				// Set the thumbnail
				setThumbnailStyle( currentThumb, serverImages[ index ].thumbnail, id, type, index );
				
				// Increment box index
				currentThumb++;
			}
		},
		
		// Function to set all thumbnails
		setThumbnails = function() {
			
			if( serverImages.length > 0 ) {
				
				// Loop through all server fetched images
				for( var i = 0, l = serverImages.length; i < l; i++ ) {
				
					// Abort loop if there are no more boxes to fill
					if( thumbs.elements[ currentThumb ] === undefined )
						break;
					
					// Set this thumbnail
					setThumbnail( 'server', serverImages[ i ].id, i );
				}
			}
		
			// Get last added ID
			var last_id = ~~window.localStorage.getItem( 'last_id' );
			
			// Loop through all IDs lower than the latest
			for( var id = last_id; id > 0; id-- ) {
			
				// Abort loop if there are no more boxes to fill
				if( thumbs.elements[ currentThumb ] === undefined )
					break;
				
				// Set this thumbnail
				setThumbnail( 'local', id );
			}
			
			// Clear unused thumbnails
			for( var i = currentThumb, l = thumbs.elements.length; i < l; i++ ) {
				setThumbnailStyle( i, '', '', '' );
			}
			
			// Reset
			currentThumb = 1;
		};
	
	setThumbnails();
	
})( window, window.document, appHelp );