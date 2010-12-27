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
			historyLimit: 3,
			
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
			
			// Get the canvas
			this.canvas = this.settings.canvas;
			
			// Get the drawing context
			this.context = this.canvas.getContext( '2d' );
			
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
			
			this.clear();
			this.reset();
			
			/*
			var num = 5;
			var opacity = 0.1;
			
			for(var i = 0; i < num; i++){
				this.context.beginPath();
				this.context.globalAlpha = 1;
				this.context.strokeStyle = this.settings.strokeStyle;
				this.context.fillStyle = "rgba(0,0,0,"+(Math.round(Math.sqrt(opacity)*10)/10)+")";
				this.context.arc(100,100,50,0,Math.PI*2,false);
				this.context.fill();
				this.context.closePath();
			}*/
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
			
				// Loop through all the touch events (or one iteration for mouse down)
				for(var x = 0; x < (e.touches ? e.touches.length : 1); x++){
					this.context.beginPath();
					this.context.globalAlpha = this.settings.opacity;
					this.context.strokeStyle = this.settings.strokeStyle;
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
						this.context.globalAlpha = this.settings.opacity;
						this.context.strokeStyle = this.settings.strokeStyle;
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
			this.history.push( this.context.getImageData( 0, 0, this.canvas.width, this.canvas.height ) );
			this.historyPos = this.history.length-1;
			
			// Trigger change callback
			this.settings.change();
		},
		
		// Function to go back in history state
		undo: function() {
			// Clear the canvas
			this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );
			// Add the image data from the previous state
			this.context.putImageData( this.history[ --this.historyPos ], 0, 0 );
		},
		
		// Function to go forward in the history states
		redo: function() {
			// Clear the canvas
			this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );
			// Add the image data from the previous state
			this.context.putImageData( this.history[ ++this.historyPos ], 0, 0 );
		},
		
		// Function to reset the drawing process
		reset: function() {
			this.history = [];
			this.historyPos = 0;
			
			// Save first state to history
			this.history.push( this.context.getImageData( 0, 0, this.canvas.width, this.canvas.height ) );
			
			// Update settings
			this.settings.change();
		},
		
		// Function to clear the entire canvas
		clear: function(){
		
			// Clear canvas
			this.context.fillStyle = this.settings.background;
			this.context.fillRect( 0, 0, this.settings.width, this.settings.height );
			
			// Save state to history
			this.history.push( this.context.getImageData( 0, 0, this.canvas.width, this.canvas.height ) );
			
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
				_this.context.drawImage( img, x, y );
				
				if( reset ) {
					// Reset the history
					_this.reset();
				} else {
				
					// Save state to history
					_this.history.push( _this.context.getImageData( 0, 0, _this.canvas.width, _this.canvas.height ) );
				
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
			var fill = this.settings.fillStyle,
				color_matches = /rgba\((\d+),(\d+),(\d+),.*?\)/.exec(fill),
				red = parseInt(color_matches[1]),
				green = parseInt(color_matches[2]),
				blue = parseInt(color_matches[3]),
				
				opacity = (newOpacity/100) * (1/this.settings.lineWidth);
			
			this.settings.fillStyle = "rgba("+red+","+green+","+blue+","+opacity+")";
			this.settings.alpha = newOpacity;
		},
		
		// Function to set the brush color. Accepts hex, rgb and rgba values
		setBrushColor: function( newColor ) {
			if( newColor.indexOf( '#' ) > -1 )
				newColor = this.convertColorFormat( newColor, 'hex', 'rgba' );
			else if( newColor.indexOf( 'rgb(' ) > -1 )
				newColor = this.convertColorFormat( newColor, 'rgb', 'rgba' );
				
			this.settings.fillStyle = newColor;
			this.setBrushOpacity( this.settings.alpha );
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