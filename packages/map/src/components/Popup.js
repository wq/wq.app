/*
FIXME

// Default popup renderer for items - override to customize
// (assumes template called [page]_popup)
map.renderPopup = function(page) {
    return function(feat, layer) {
        var attrs = L.extend({ id: feat.id }, feat.properties);
        layer.bindPopup(tmpl.render(page + '_popup', attrs));
    };
};
*/
