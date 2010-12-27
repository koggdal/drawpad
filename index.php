<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8" />
	<title>DrawApp</title>
	<base href="http://drawapp.koggdal.com/" />
	<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no;" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black" />
	<link rel="stylesheet" href="css/style-min-1293066521.css" />
	
	<script src="js/browsercheck-1293067116.js"></script>
</head>
<body id="mode_home">
	<div id="preload">
		<img src="images/icons.png" alt="" />
		<img src="images/slider_icons.png" alt="" />
		<img src="images/colorspace.png" alt="" />
		<img src="images/spectrum.png" alt="" />
		<img src="images/spectrum-handle.png" alt="" />
	</div>
	<header id="app_header" class="toolbar">
		<div class="toolbar_wrapper">
			<div id="header_home">
				<button type="button" class="edit hidden">Edit</button>
				<h1>DrawApp</h1>
				<button type="button" class="login">Log in</button>
			</div>
			
			<div id="header_draw">
				<div id="color" class="colorbox"></div>
				<div id="swatches">
					<div class="colorbox"></div>
					<div class="colorbox"></div>
					<div class="colorbox"></div>
					<div class="colorbox"></div>
					<div class="colorbox"></div>
					<div class="colorbox"></div>
				</div>
				
				<div id="colorpicker" class="colorpicker">
					<p class="message">All the swatches are filled. Choose one to replace.</p>
					<div class="colorspace">
						<div class="marker"></div>
						<img src="images/colorspace.png" alt="" />
					</div>
					<div class="spectrum slider">
						<div class="slider-bg">
							<div class="marker slider-handle"></div>
						</div>
					</div>
					<div class="buttons">
						<button type="button" class="add-swatch">Add Swatch</button>
					</div>
				</div>
			</div>
		</div>
	</header>
	
	<section id="app_content">
		<div id="home">
			<div class="home_content">
				<form action="index.html" method="post" class="login_box">
					<fieldset>
						<label for="email">E-mail</label><br />
						<input type="email" name="email" id="email" />
						<br />
						<label for="password">Password</label><br />
						<input type="password" name="password" id="password" /><br />
						<button type="submit">Log in</button>
					</fieldset>
				</form>
				<div class="grid">
					<div class="image new active"><b>+</b><br />New Image</div>
					<div class="image"></div>
					<div class="image"></div>
					<div class="image"></div>
					<div class="image"></div>
					<div class="image"></div>
					<div class="image"></div>
					<div class="image"></div>
					<div class="image"></div>
					<div class="image"></div>
					<div class="image"></div>
					<div class="image"></div>
				</div>
			</div>
		</div>
		<div id="draw">
			<div class="toolbar_wrapper">
				<div class="tooltips">
					<p class="color tip_up">Choose color</p>
					<p class="swatches tip_up">Easily switch between colors with swatches.<br /> Add swatches from the color picker.</p>
					<p class="size tip_down">Brush size</p>
					<p class="opacity tip_down">Brush opacity</p>
					<p class="info info_desktop">Right click on canvas<br />to hide the toolbars<br /><small>(click to hide tooltips)</small></p>
					<p class="info info_android">Hiding the toolbars is<br />not available on Android<br /><small>(tap to hide tooltips)</small></p>
					<p class="info info_ios">Tap with two fingers<br />to hide the toolbars<br /><small>(tap to hide tooltips)</small></p>
				</div>
			</div>
			<div class="message"></div>
			<div class="brush_size"></div>
			<canvas id="stage" width="320" height="480"></canvas>
		</div>
	</section>
	
	<footer id="app_footer" class="toolbar">
		<div id="footer_home"></div>
		
		<div id="footer_draw">
			<div class="toolbar_wrapper">
				<div id="size" class="slider">
					<div class="slider-bg">
						<div class="slider-handle"></div>
					</div>
				</div>
				<div id="opacity" class="slider">
					<div class="slider-bg">
						<div class="slider-handle"></div>
					</div>
				</div>
			</div>
			<div class="buttons">
				<div class="toolbar_wrapper">
					<button type="button" class="home"><span></span>Home</button>
					<button type="button" class="undo disabled"><span></span>Undo</button>
					<button type="button" class="redo disabled"><span></span>Redo</button>
					<button type="button" class="save"><span></span>Save</button>
				</div>
			</div>
			<div class="save_box">
				<div class="toolbar_wrapper save_choices">
					<h2>Browser storage</h2>
					<p>The image is stored in the browser's own local storage, and will only be available from this browser.</p>
					<h2>Cloud storage</h2>
					<p>The image is stored on the app server, and will be available with a password from any browser.</p>
					<button type="button" class="save_local">Save to browser storage</button>
					<button type="button" class="save_cloud">Save to cloud storage</button>
					<button type="button" class="save_cancel">Cancel</button>
				</div>
				<div class="toolbar_wrapper cloud_info">
					<h2>Cloud storage</h2>
					<p>To be able to save to the app server, you need an account. It's free and easy to set up.</p>
					<button type="button" class="register_button">Register new account</button>
					<button type="button" class="login_button">Log in with existing account</button>
					<button type="button" class="back_button">Back</button>
				</div>
				<div class="toolbar_wrapper cloud_register">
					<h2>Register for cloud storage</h2>
					<p>To be able to save to the app server, you need an account. It's free and easy to set up.</p>
					<form>
						<fieldset>
							<label for="reg_email">E-mail</label><br />
							<input type="email" name="email" id="reg_email" placeholder="example@domain.com" /><br />
							<label for="reg_password_1">Password</label><br />
							<input type="password" name="password_1" id="reg_password_1" placeholder="Minimum 6 characters" /><br />
							<label for="reg_password_2">Password again</label><br />
							<input type="password" name="password_2" id="reg_password_2" placeholder="Same password as above" /><br />
							<button type="button" class="back_button">Back</button>
							<button type="button" class="register_button">Register and save</button>
						</fieldset>
					</form>
				</div>
				<div class="toolbar_wrapper cloud_login">
					<h2>Log in to cloud storage</h2>
					<p>To be able to save to the app server, you need an account. Log in to it here.</p>
					<form>
						<fieldset>
							<label for="login_email">E-mail</label><br />
							<input type="email" name="email" id="login_email" /><br />
							<label for="login_password">Password</label><br />
							<input type="password" name="password" id="login_password" /><br />
							<button type="button" class="back_button">Back</button>
							<button type="button" class="login_button">Log in and save</button>
						</fieldset>
					</form>
				</div>
			</div>
		</div>
	</footer>
	
	<script src="js/combined-min-1293066367.js"></script>
<?php
/*
 *	Original JavaScript files before combining and minifying
 *
	<script src="js/apphelp.js"></script>
	<script src="js/apphelp.slider.js"></script>
	<script src="js/apphelp.colorpicker.js"></script>
	<script src="js/draw.js"></script>
	<script src="js/app.js"></script>
*/
?>
</body>
</html>