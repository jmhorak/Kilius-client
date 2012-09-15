/**
 * Promise.js
 * Author: Jeff Horak (@jmhorak)
 * Date: 7/9/12
 * MIT License
 */
var Promise=function(){function d(c){return c&&c instanceof Function}function b(c,a){for(var e=c.length,b=a||this._arguments,f;e--;)f=c[e],d(f)&&f.apply(null,b)}function g(){this.resolveCallbacks=[];this.rejectCallbacks=[];this.progressCallbacks=[]}var a=function(){this._arguments=null;this.state="unfulfilled";this.resolveCallbacks=[];this.rejectCallbacks=[];this.progressCallbacks=[]};a.prototype.then=function(c,a,e){d(c)&&"rejected"!==this.state&&(this.resolveCallbacks.push(c),"resolved"===this.state&&
(this.state="resolved",b.call(this,this.resolveCallbacks),g.call(this)));d(a)&&"resolved"!==this.state&&(this.rejectCallbacks.push(a),"rejected"===this.state&&(this.state="rejected",b.call(this,this.rejectCallbacks),g.call(this)));d(e)&&"unfulfilled"===this.state&&this.progressCallbacks.push(e);return this};a.prototype.whenDone=function(a){return this.then(a,null,null)};a.prototype.ifFail=function(a){return this.then(null,a,null)};a.prototype.onUpdate=function(a){return this.then(null,null,a)};a.prototype.resolve=
function(){if("unfulfilled"!==this.state)throw Error("Cannot resolve a promise unless it is unfulfilled");this._arguments=Array.prototype.slice.call(arguments,0);this.state="resolved";b.call(this,this.resolveCallbacks);g.call(this)};a.prototype.reject=function(){if("unfulfilled"!==this.state)throw Error("Cannot reject a promise unless it is unfulfilled");this._arguments=Array.prototype.slice.call(arguments,0);this.state="rejected";b.call(this,this.rejectCallbacks);g.call(this)};a.prototype.updateProgress=
function(){if("unfulfilled"!==this.state)throw Error("Cannot update progress of a promise unless it is unfulfilled");b.call(this,this.progressCallbacks,arguments)};a.when=function(){var c=Array.prototype.slice,b=c.call(arguments,0),e=[],d=new a,f=null;b[0]&&"[object Array]"===Object.prototype.toString.call(b[0])&&(b=b[0]);d.then=function(d,g){function h(){for(var a=0,b=e.length,c=!1;a<b&&!c;a++)c="resolved"!==e[a].state;c||d.apply(null,f)}b.forEach(function(b){b instanceof a&&(b.resolve=function(){var b=
e.indexOf(this),d=c.call(arguments,0);if(0>b)throw Error("Could not find promise");f[b]=d;a.prototype.resolve.apply(this,arguments)},b.then(h,g),e.push(b))});0===e.length?d():f=Array(e.length);return this};return d};return a}();"undefined"===typeof window&&(exports.Promise=Promise);