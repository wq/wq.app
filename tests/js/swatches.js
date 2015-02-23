requirejs.config({
    'baseUrl': '../js'
});

require(['jquery', 'jquery.mobile'], function($, jqm) {
    // Initialize page and toolbars
    jqm.initializePage();
    $( "[data-role='header'], [data-role='footer']" ).toolbar().show();
    var $navbar = $( "[data-role='navbar']" );
    $navbar.navbar();

    // Identify available themes (extract from navbar button data-themes)
    var $buttons = $navbar.find('button');
    var themes = [];
    $buttons.each(function(i, btn) {
        themes.push($(btn).data('theme'));
    });

    // Change page theme whenever navbar is clicked
    $buttons.click(function(evt) {
        var theme = $(evt.target).data('theme');
        themes.forEach(function(t) {
            jqm.activePage.removeClass("ui-page-theme-" + t);
        });
        jqm.activePage.addClass("ui-page-theme-" + theme);
    });
});
