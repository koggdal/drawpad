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