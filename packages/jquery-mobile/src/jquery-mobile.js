import jQuery from 'jquery';
import Mustache from 'mustache';
import jqmInit from '../vendor/jquery-mobile';
import photos from './photos';

const HTML = '@@HTML', // @wq/router
    RENDER = 'RENDER', // @wq/router
    SPIN_START = 'SPIN_START', // @wq/app:spinner
    SPIN_STOP = 'SPIN_STOP'; // @wq/app:spinner

const jqmRenderer = {
    name: 'jqmrenderer',
    type: 'renderer',
    dependencies: [photos],

    config: {
        templates: {},
        partials: {},
        injectOnce: false,
        debug: false,
        noScroll: false,
        transitions: {
            default: 'none',
            dialog: 'none',
            maxwidth: 800
        }
    },

    init(config) {
        const appConf = this.app.config;

        if (!config) {
            config = {};
            if (appConf.template?.templates) {
                console.warn(
                    'Rename config.template.templates to config.jqmrenderer.templates'
                );
                config.templates = appConf.template.templates;
                if (appConf.template.partials) {
                    config.partials = appConf.template.partials;
                }
            }

            if (appConf.transitions) {
                console.warn(
                    'Rename config.transitions to config.jqmrenderer.transitions'
                );
                config.transitions = appConf.transitions;
            }

            if (appConf.router?.injectOnce) {
                console.warn(
                    'Rename config.router.injectOnce to config.jqmrenderer.injectOnce'
                );
                config.injectOnce = appConf.router.injectOnce;
            }
        }

        if (!('debug' in config)) {
            config.debug = appConf.debug;
        }

        if (config.transitions) {
            config.transitions = {
                ...this.config.transitions,
                ...config.transitions
            };
        }
        if (config.templates && config.templates.partials) {
            config.partials = config.templates.partials;
        }
        Object.assign(this.config, config);
        config = this.config;

        // Configuration options:
        // Set `injectOnce`to true to re-use rendered templates
        // Set `debug` to true to log template & context information
        // Set `noScroll` to work around jsdom scroll support.

        if (config.noScroll) {
            window.scrollTo = function () {};
        }

        jQuery(document).on('mobileinit', () => {
            jQuery.extend(jQuery.mobile, {
                hashListeningEnabled: false,
                pushStateEnabled: false
            });
        });
        jqmInit(jQuery, window, document);
        const jqm = jQuery.mobile;

        this.$ = jQuery;
        this.jqm = jqm;

        // Configure jQuery Mobile transitions
        if (config.transitions) {
            jqm.defaultPageTransition = config.transitions['default'];
            jqm.defaultDialogTransition = config.transitions.dialog;
            jqm.maxTransitionWidth = config.transitions.maxwidth;
        }

        // Ready to go!
        jqm.initializePage();
    },

    context(ctx, routeInfo) {
        if (routeInfo.mode === 'edit' && routeInfo.variant === 'new') {
            return {
                new_attachment: true
            };
        }
    },

    thunks: {
        [RENDER]() {
            this.renderPage(this.app.router.getContext());
        },
        [SPIN_START](dispatch, getState) {
            this.updateSpinner(getState());
        },
        [SPIN_STOP](dispatch, getState) {
            this.updateSpinner(getState());
        }
    },

    renderPage(context) {
        this._lastContext = context;

        const { router_info } = context,
            { full_path: url, dom_id: pageid, name: routeName, template } =
                router_info || {},
            once = null, // FIXME
            ui = null; // FIXME

        if (!routeName) {
            return;
        }

        var $page,
            html = context[HTML];

        if (html) {
            if (this.config.debug) {
                console.log('Injecting pre-rendered HTML:');
                console.log(html);
            }
            $page = this.injectHTML(html, url, pageid);
        } else {
            if (this.config.debug) {
                console.log(
                    'Rendering ' +
                        url +
                        " with template '" +
                        template +
                        "' and context:"
                );
                console.log(context);
            }
            if (once || this.config.injectOnce) {
                // Only render the template once
                $page = this.injectOnce(template, context, url, pageid);
            } else {
                // Default: render the template every time the page is loaded
                $page = this.inject(template, context, url, pageid);
            }
        }

        this._handlePage($page, ui);
    },

    updateSpinner(state) {
        const { spinner } = state,
            { jqm } = this;
        if (spinner && spinner.active) {
            let opts = {};
            if (spinner.message) {
                opts.text = spinner.message;
                opts.textVisible = true;
            }
            if (spinner.type === 'alert') {
                opts.theme = jqm.pageLoadErrorMessageTheme;
                opts.textonly = true;
            }
            jqm.loading('show', opts);
        } else {
            jqm.loading('hide');
        }
    },

    // Render page and inject it into DOM (replace existing page if it exists)
    inject(template, context, url, pageid) {
        const { $, jqm } = this;

        template = this.config.templates[template] || template;
        var html = Mustache.render(template, context, this.config.partials);

        if (!html.match(/<div/)) {
            throw "No content found in template '" + template + "'!";
        }
        var title = html.split(/<\/?title>/)[1];
        var body = html.split(/<\/?body[^>?]*>/)[1];
        if (body) {
            html = body;
        }
        var $page = $(html.trim());

        // Check for <div data-role=page>, in case it is not the only element in
        // the selection (due to an external footer or something)
        var $rolePage = $page.filter(":jqmData(role='page')");
        if ($rolePage.length > 0) {
            if (this.config.debug && $rolePage.length != $page.length) {
                console.info(
                    $page.length -
                        $rolePage.length +
                        ' extra element(s) ignored.'
                );
            }
            $page = $rolePage;
        } else if ($page.length > 1) {
            $page = $('<div>').append($page);
        }

        var role = $page.jqmData('role');
        var $oldpage;
        if (pageid) {
            if (pageid === true) {
                pageid = template + '-page';
            }
            $oldpage = $('#' + pageid);
        }
        if (!$oldpage || !$oldpage.length) {
            $oldpage = $(":jqmData(url='" + url + "')");
            if (
                pageid &&
                $oldpage.attr('id') &&
                $oldpage.attr('id') != pageid
            ) {
                $oldpage = null;
            }
        }
        if ($oldpage && $oldpage.length) {
            $oldpage.remove();
        }
        if (role == 'popup' || role == 'panel') {
            $page.appendTo(jqm.activePage[0]);
            if (role == 'popup') {
                $page.popup();
            } else {
                $page.panel();
            }
            $page.trigger('create');
        } else {
            $page.attr('data-' + jqm.ns + 'url', url);
            $page.attr('data-' + jqm.ns + 'title', title);
            if (pageid) {
                $page.attr('id', pageid);
            }
            $page.appendTo(jqm.pageContainer);
            $page.page();
        }
        return $page;
    },

    // Render template only once
    injectOnce(template, context, url, id) {
        const { $, jqm } = this;

        if (!id) {
            id = template + '-page';
        }
        var $page = $('#' + id);
        if (!$page.length) {
            // Initial render, use context if available
            $page = this.inject(template, context, url, id);
        } else {
            // Template was already rendered; ignore context but update URL
            // - it is up to the caller to update the DOM
            $page.attr('data-' + jqm.ns + 'url', url);
            $page.jqmData('url', url);
        }
        return $page;
    },

    // Render HTML loaded from server
    injectHTML(html, url, id) {
        return this.inject('{{{html}}}', { html: html }, url, id);
    },

    // Initialize page events
    _handlePage($page, ui) {
        const { $, jqm } = this;

        // Run any/all plugins on the specified page
        $page.on('pageshow', () => {
            this.handleShow($page);
        });

        // Ensure local links are routed
        $page.on('click', 'a', evt => this._handleLink(evt));

        // Handle form events
        $page.on('click', 'form [type=submit]', evt =>
            this._handleSubmitClick(evt)
        );
        $page.on('submit', 'form', evt => this._handleForm(evt));

        // Display page/popup/panel
        const role = $page.jqmData('role') || 'page';
        var options;
        if (role == 'page') {
            options = (ui && ui.options) || {};
            options.allowSamePageTransition = true;
            jqm.changePage($page, options);
        } else if (role == 'popup') {
            options = {};
            if (ui && ui.options) {
                options.transition = ui.options.transition;
                options.positionTo = $page.data('wq-position-to');
                var link = ui.options.link;
                if (link) {
                    if (link.jqmData('position-to')) {
                        options.positionTo = link.jqmData('position-to');
                    }
                    // 'origin' won't work since we're opening the popup manually
                    if (!options.positionTo || options.positionTo == 'origin') {
                        options.positionTo = link[0];
                    }
                    // Remove link highlight *after* popup is closed
                    $page.bind('popupafterclose.resetlink', function () {
                        link.removeClass('ui-btn-active');
                        $(this).unbind('popupafterclose.resetlink');
                    });
                }
            }
            $page.popup('open', options);
        } else if (role == 'panel') {
            $page.panel('open');
        }
    },

    _handleLink(evt) {
        const target = evt.currentTarget;
        if (target.rel === 'external') {
            return;
        }
        const href = target.href;
        if (href === undefined) {
            return;
        }
        const url = new URL(href, window.location);
        if (url.origin != window.location.origin) {
            return;
        }
        evt.preventDefault();
        this.app.router.push(url.pathname + url.search);
    },

    // Remember which submit button was clicked (and its value)
    _handleSubmitClick(evt) {
        const $ = this.$;
        var $button = $(evt.target),
            $form = $(evt.target.form),
            name = $button.attr('name'),
            value = $button.attr('value');
        if (name !== undefined && value !== undefined) {
            $form.data('wq-submit-button-name', name);
            $form.data('wq-submit-button-value', value);
        }
    },

    // Handle form submit from [url]_edit views
    async _handleForm(evt) {
        const { $, app } = this;
        var $form = $(evt.target),
            $submitVal,
            backgroundSync,
            storage;
        if (!app) {
            return;
        }
        if (evt.isDefaultPrevented()) {
            return;
        }
        $form.find('[type=submit]').prop('disabled', true);
        if ($form.data('wq-submit-button-name')) {
            $submitVal = $('<input>')
                .attr('name', $form.data('wq-submit-button-name'))
                .attr('value', $form.data('wq-submit-button-value'));
            $form.append($submitVal);
        }
        if ($form.data('wq-json') !== undefined && !$form.data('wq-json')) {
            app.spin.forSeconds(10);
            return; // Defer to default (HTML-based) handler
        }

        if ($form.data('wq-background-sync') !== undefined) {
            backgroundSync = $form.data('wq-background-sync');
        } else {
            backgroundSync = app.config.backgroundSync;
        }

        if ($form.data('wq-storage') !== undefined) {
            storage = $form.data('wq-storage');
        }

        var outboxId = $form.data('wq-outbox-id');
        var preserve = $form.data('wq-outbox-preserve');
        var url = $form.attr('action').replace(app.service + '/', '');
        var vals = {};
        var $files = $form.find('input[type=file]');
        var has_files = false;
        $files.each(function (i, input) {
            if ($(input).val().length > 0) {
                has_files = true;
            }
        });

        if (!app.isRegistered(url)) {
            // Unrecognized URL; assume a regular form post
            app.spin.forSeconds(10);
            return;
        }
        if (has_files && !window.Blob) {
            // Files present but there's no Blob API.  Looks like we're in a an old
            // browser that can't upload files via AJAX.  Bypass wq/outbox.js
            // entirely and hope server is able to respond to regular form posts
            // with HTML (hint: wq.db is).
            app.spin.forSeconds(10);
            return;
        }

        // Modern browser and/or no files present; skip regular form submission,
        // we're saving this via wq/outbox.js
        evt.preventDefault();

        // Use a simple JSON structure for values, which is better for outbox
        // serialization.
        function addVal(name, val) {
            if (vals[name] !== undefined) {
                if (!Array.isArray(vals[name])) {
                    vals[name] = [vals[name]];
                }
                vals[name].push(val);
            } else {
                vals[name] = val;
            }
        }
        $.each($form.serializeArray(), function (i, v) {
            addVal(v.name, v.value);
        });
        // Handle <input type=file>.  Use HTML JSON form-style objects, but
        // with Blob instead of base64 encoding to represent the actual file.
        if (has_files) {
            $files.each(function () {
                var name = this.name,
                    file,
                    slice;
                if (!this.files || !this.files.length) {
                    return;
                }
                for (var i = 0; i < this.files.length; i++) {
                    file = this.files[i];
                    slice = file.slice || file.webkitSlice;
                    addVal(name, {
                        type: file.type,
                        name: file.name,
                        // Convert to blob for better serialization
                        body: slice.call(file, 0, file.size, file.type)
                    });
                }
            });
        }
        // Handle blob-stored files created by (e.g.) wq/photos.js
        $form.find('input[data-wq-type=file]').each(function () {
            // wq/photo.js files in memory, copy over to form
            var name = this.name;
            var value = this.value;
            var curVal = Array.isArray(vals[name]) ? vals[name][0] : vals[name];
            var photos = app.plugins.photos;
            if (curVal && typeof curVal === 'string') {
                delete vals[name];
            }
            if (!value || !photos) {
                return;
            }

            var data = photos._files[value];
            if (data) {
                has_files = true;
                addVal(name, data);
                delete photos._files[value];
            }
        });

        if ($submitVal) {
            $submitVal.remove();
        }

        $form.find('.error').html('');

        const [item, error] = await app.submitForm({
            url,
            storage,
            backgroundSync,
            has_files,
            outboxId,
            preserve,
            data: vals
        });

        if (item && item.id) {
            $form.attr('data-wq-outbox-id', item.id);
            if (error) {
                this._showOutboxErrors(item, $form);
            }
        }
        $form.find('[type=submit]').prop('disabled', false);
    },

    _showOutboxErrors(item, $page) {
        if ($page.is('form') && item.options.method == 'DELETE') {
            if (!$page.find('.error').length) {
                // Delete form does not contain error placeholders
                // but main form might
                $page = $page.parents('.ui-page');
            }
        }
        if (!item.error) {
            showError('Error saving data.');
            return;
        } else if (typeof item.error === 'string') {
            showError(item.error);
            return;
        }
        // Save failed and error information is in JSON format
        // (likely a 400 bad data error)
        var errs = Object.keys(item.error);

        if (errs.length == 1 && errs[0] == 'detail') {
            // General API errors have a single "detail" attribute
            showError(item.error.detail);
        } else {
            // REST API provided per-field error information

            // Form errors (other than non_field_errors) are keyed by fieldname
            errs.forEach(function (f) {
                // FIXME: there may be multiple errors per field
                var err = item.error[f][0];
                if (f == 'non_field_errors') {
                    showError(err);
                } else {
                    if (typeof err !== 'object') {
                        showError(err, f);
                    } else {
                        // Nested object errors (e.g. attachment)
                        item.error[f].forEach(function (err, i) {
                            for (var n in err) {
                                var fid = f + '-' + i + '-' + n;
                                showError(err[n][0], fid);
                            }
                        });
                    }
                }
            });
            if (!item.error.non_field_errors) {
                showError('One or more errors were found.');
            }
        }

        function showError(err, field) {
            if (field) {
                field = field + '-';
            } else {
                field = '';
            }
            var sel =
                '.' + item.options.modelConf.name + '-' + field + 'errors';
            $page.find(sel).html(err);
        }
    },

    handleShow() {
        this.runPlugins();
    },

    async runPlugins() {
        if (!this.app) {
            return;
        }
        const context = this._lastContext,
            { router_info: routeInfo } = context;

        var item;

        if (context.outbox_id) {
            item = context;
        } else if (routeInfo.item_id) {
            if (context.local) {
                item = context;
            } else {
                item = await this.app.models[routeInfo.page].find(
                    routeInfo.item_id
                );
            }
        } else {
            item = {};
        }
        this.app.callPlugins('run', [
            this.jqm.activePage,
            {
                ...routeInfo,
                item,
                context
            }
        ]);
    },

    run($page, routeInfo) {
        this.runOutbox($page, routeInfo);
        this.runPatterns($page, routeInfo);
    },

    async runOutbox($page, routeInfo) {
        const { name, outbox_id } = routeInfo,
            { outbox } = this.app;
        if (name === 'outbox_edit') {
            const item = await outbox.loadItem(outbox_id);
            if (item.error) {
                this._showOutboxErrors(item, $page);
            }
        }
    },

    runPatterns($page, { page, mode, context: pageContext }) {
        const $ = this.$;

        $page.find('button[data-wq-action=addattachment]').click(evt => {
            var $button = $(evt.target),
                section = $button.data('wq-section'),
                count = $page.find('.section-' + section).length,
                template = this.config.templates[
                    page + '_' + (mode ? mode : 'edit')
                ],
                pattern = '{{#' + section + '}}([\\s\\S]+){{/' + section + '}}',
                match = template && template.match(pattern),
                context = {
                    '@index': count,
                    new_attachment: true
                };

            if (!match) {
                return;
            }

            for (var key in pageContext) {
                context[key.replace(section + '.', '')] = pageContext[key];
            }
            const $attachment = $(
                Mustache.render(match[1], context, this.config.partials)
            );

            if ($attachment.is('tr')) {
                $button.parents('tr').before($attachment);
                $attachment.enhanceWithin();
            } else {
                $button.parents('li').before($attachment);
                $attachment.enhanceWithin();
                $button.parents('ul').listview('refresh');
            }
        });
        $page.on('click', 'button[data-wq-action=removeattachment]', evt => {
            const $button = $(evt.target),
                section = $button.data('wq-section'),
                $row = $button.parents('.section-' + section);
            $row.remove();
        });
    },

    onsync() {
        const { router } = this.app,
            context = router.getContext(),
            { router_info: routeInfo = {} } = context,
            { page, mode } = routeInfo;
        if (page === 'outbox' || mode === 'list') {
            router.reload();
        }
    }
};
export default jqmRenderer;
