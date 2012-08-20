/*
 * wq.app - spinner.js
 * Wrapper for jQuery Mobile's spinner
 * (c) 2012 S. Andrew Sheppard
 * http://wq.io/license
 */

define(['./lib/jquery.mobile'], 
function(jqm) {

// Exported module object
var spin = {};

spin.start = function(msg, theme) {
    if (msg)
        jqm.loadingMessageTextVisible = true;
    if (!theme)
        theme = 'a';
    jqm.showPageLoadingMsg(theme, msg);
    jqm.loadingMessageTextVisible = false;
};

spin.stop = function() {
    jqm.hidePageLoadingMsg();
}

return spin;

});
