import jQuery from 'jquery';
import jQueryMobile from '../vendor/jquery-mobile';

export default function(noScroll) {
    if (noScroll) {
        window.scrollTo = function() {};
    }
    jQueryMobile(jQuery, window, document);
    return jQuery;
}
