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
		tmpContext.drawImage( draw.canvas, offset_x, offset_y, size, size, 0, 0, 88, 88 );
		
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
		window.localStorage.setItem( 'image_' + id, draw.canvas.toDataURL() );
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
			data: 'user_id='+user_id+'&fullsize='+draw.canvas.toDataURL()+'&thumb='+createThumbnail( 'data_url' ),
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