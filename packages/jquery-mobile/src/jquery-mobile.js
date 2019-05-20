import jQuery from 'jquery';
import jQueryMobile from '../vendor/jquery-mobile';

export default function(noScroll) {
    if (noScroll) {
        window.scrollTo = function() {};
    }
    jQuery(document).on('mobileinit', () => {
        jQuery.extend(jQuery.mobile, {
            defaultPageTransition: 'none',
            hashListeningEnabled: false,
            pushStateEnabled: false
        });
    });
    jQueryMobile(jQuery, window, document);
    return jQuery;
}
