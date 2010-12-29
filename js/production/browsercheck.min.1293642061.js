/*
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
(function(b,a,c){b.browserCheck={userAgent:navigator.userAgent,uaMatch:function(p){p=p.toLowerCase();var f=/(webkit)[ \/]([\w.]+)/,s=/(opera)(?:.*version)?[ \/]([\w.]+)/,r=/ms(ie) ([\w.]+)/,n=/(firefox)\/([\w.]+)/,t=/(mozilla)(?:.*? rv:([\w.]+))?/,g=/(mac).*?([\d\.]+);/,w=/(windows);/,e=/; (windows) nt/,l=/(linux)/,m=/(iphone|ipad).*? os (|\d|\d_\d|\d_\d_\d) /,y=/(android) (\d\.\d)/;var j=f.exec(p)||s.exec(p)||r.exec(p)||p.indexOf("compatible")<0&&n.exec(p)||p.indexOf("compatible")<0&&t.exec(p)||[],v=y.exec(p)||m.exec(p)||g.exec(p)||w.exec(p)||e.exec(p)||l.exec(p)||[],h=j[2].split("."),x=v[2]?v[2].split("."):[],u=[j[1],v[1]],d="",q="";if(x.length==1){x=v[2].split("_")}var k=v[1];for(var o=0;o<h.length;o++){u.push(j[1]+d+h[o]);d+=h[o]}for(var o=0;o<x.length;o++){k+="\n"+v[1]+q+x[o];u.push(v[1]+q+x[o]);q+=x[o]}return{browser:j[1]||"",version:j[2]||"0",os:v[1]||"",classNames:u}},browser:{},os:{},add:function(){var d=browserCheck.uaMatch(browserCheck.userAgent);if(d.browser){browserCheck.browser[d.browser]=true;browserCheck.browser.version=d.version;browserCheck.browser.name=d.browser;browserCheck.browser.classNames=d.classNames;browserCheck.os.name=d.os;if(d.os.length>0){browserCheck.os[d.os]=true}}},addClass:function(e){var d=a.documentElement.className;a.documentElement.className+=(d=="")?e:" "+e},addClasses:function(){var f=browserCheck.browser.classNames,d=f.length;for(var e=d;e--;){browserCheck.addClass(f[e])}}};browserCheck.add();browserCheck.addClasses()})(window,document);