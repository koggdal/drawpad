DrawPad
====================================================

DrawPad is a web app for drawing anything you like. Since it is a web app it is not restricted to only the iPhone, even though it is made primarily for the iPhone. It can be used in all modern browsers that has support for HTML5 canvas. The current release is not fully supported on Android, because multitouch is not supported in that browser which makes it impossible to hide the toolbars.

The app allows you to draw with different brush sizes and opacity, and also offers a complete color picker with swatches. You can undo 10 steps (this will increase in future releases) and redo to get it back again.

You can also save the image to one of two destinations; local browser storage or cloud storage. The browser storage uses HTML5 Web Storage, which means the image is stored in the browser's cache until the cache is cleared (it survives restarts and everything though, unless the cache is cleared on close). When saved to cloud storage, it is saved on the app server and is accessible from any browser through a login. That means saving to the cloud requires you to register, but only email and password are required.