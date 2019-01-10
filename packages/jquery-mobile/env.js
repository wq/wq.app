const IDBEnvironment = require('@wq/jest-env-jsdom-idb');
const jQuery = require('jquery'),
      jQueryMobile = require('./vendor/jquery-mobile');


class JQMEnvironment extends IDBEnvironment {
    async setup() {
        await super.setup();
        const window = this.dom.window,
              document = window.document,
              $ = jQuery(window);

        this.global.jQuery = $;
        jQueryMobile($, window, document);
        window.scrollTo = () => {};
    }
    async teardown() {
        delete this.global.jQuery;
        // Avoid jest error by waiting for libs to finish initializing
        await new Promise(resolve => setTimeout(resolve, 5000));
        await super.teardown();
    }
}


module.exports = JQMEnvironment;
