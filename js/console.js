/* console
 * Fallback for code using console.log
 * (c) 2012 S. Andrew Sheppard
 */

define(function() {

if (window.console)
    return window.console
else
    return {
        'log': function() {}
    };

});
