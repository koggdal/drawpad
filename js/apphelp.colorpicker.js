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