/*!
 * wq.app 1.0.0-dev - wq/locate.js
 * Geolocation utilities via Leaflet's Map.locate
 * (c) 2013-2016, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['leaflet'],
function(L) {

// Exported module object
var locate = {
    'name': 'locate',
    'config': {
        'fieldNames': {
            'latitude': 'latitude',
            'longitude': 'longitude',
            'geometry': 'geometry',
            'accuracy': 'accuracy',
            'toggle': 'toggle',
            'mode': 'mode'
        }
    }
};

locate.init = function(conf) {
    L.extend(locate.config, conf || {});
};

// wq/app.js plugin
locate.run = function($page, routeInfo) {
    if (!routeInfo.page_config.locate) {
        return;
    }
    var map = require('wq/map').getMap(routeInfo);
    if (!map) {
        return;
    }
    var fields = {};
    for (var field in locate.config.fieldNames) {
        var name = locate.config.fieldNames[field];
        fields[field] = $page.find('[name=' + name + ']');
    }
    var locator = locate.locator(
        map,
        fields,
        locate.config
    );
    $page.on('pagehide', function() {
        locator.stop();
    });
};

// Interactive GPS & map-based locator tool
// map should be an L.map; fields should be an map of keys to jQuery-wrapped
// <input>s
locate.Locator = function(map, fields, opts) {
    var self = this;

    if (!fields) {
        fields = {};
    }
    if (!opts) {
        opts = {};
    }
    if (!opts.precision) {
        opts.precision = 6;
    }

    var _mode, _marker, _circle;

    // Mode switching functions (define fields.toggle for default usage)
    self.setMode = function(mode) {
        if (!mode || !self[mode + 'Start']) {
            return;
        }
        self.stop();
        _mode = mode;
        self.start();
        if (opts.onSetMode) {
            opts.onSetMode(mode);
        }
    };

    self.start = function() {
        if (_mode) {
            self[_mode + 'Start']();
        }
    };

    self.stop = function() {
        if (_mode) {
            self[_mode + 'Stop']();
        }
    };

    // GPS mode
    self.gpsStart = function() {
        var locateOpts = {
            'enableHighAccuracy': true,
            'watch': true,
            'setView': true,
            'timeout': 60 * 1000
        };
        map.off('locationfound');
        map.off('locationerror');
        map.on('locationfound', success);
        map.on('locationerror', error);
        map.locate(locateOpts);
        function success(evt) {
            self.update(evt.latlng, evt.accuracy);
        }
        function error(evt) {
            self.onerror(evt);
        }
    };

    self.gpsStop = function() {
        map.stopLocate();
    };

    // Interactive mode
    self.interactiveStart = function() {
        L.DomUtil.addClass(map._container, 'interactive');
    };

    self.interactiveStop = function() {
        L.DomUtil.removeClass(map._container, 'interactive');
    };

    // Manual mode
    self.manualStart = function() {
        if (!fields.latitude || !fields.longitude) {
            return;
        }
        fields.latitude.attr('readonly', false);
        fields.longitude.attr('readonly', false);
    };

    self.manualStop = function() {
        fields.latitude.attr('readonly', true);
        fields.longitude.attr('readonly', true);
    };

    // Default Circle & Marker generators, override to customize
    self.makeCircle = function() {
        return L.circle([0,0],1,{'weight': 1});
    };

    self.makeMarker = function() {
        return L.marker([0,0]);
    };

    // Display and save updates to location
    self.update = function(loc, accuracy) {
        if (!_marker) {
            _marker = self.makeMarker().addTo(map);
        }
        if (!_circle) {
            _circle = self.makeCircle().addTo(map);
        }
        // Update display
        _marker.setLatLng(loc);
        _circle.setLatLng(loc).setRadius(accuracy);

        // Save to fields
        if (fields) {
            if (fields.latitude) {
                fields.latitude.val(
                    L.Util.formatNum(loc.lat, opts.precision)
                );
            }
            if (fields.longitude) {
                fields.longitude.val(
                    L.Util.formatNum(loc.lng, opts.precision)
                );
            }
            if (fields.geometry) {
                fields.geometry.val(JSON.stringify({
                    'type': "Point",
                    'coordinates': [loc.lng, loc.lat]
                }));
            }
            if (fields.accuracy) {
                fields.accuracy.val(accuracy);
            }
            if (fields.mode) {
                fields.mode.val(_mode);
            }
        }

        // User-defined callback (FIXME: make event?)
        if (opts.onUpdate) {
            opts.onUpdate(loc, accuracy);
        }
    };

    self.onerror = function(evt) {
        if (window.console) {
            window.console.log("Error retrieving coordinates!");
        }
        if (opts.onError) {
            opts.onError(evt);
        }
    };

    // Respond to map clicks in interactive mode
    function _clickMap(evt) {
        if (_mode != 'interactive') {
            return;
        }
        // Estimate accuracy based on viewport information
        // (higher zoom = better accuracy)
        var ll = map.getBounds();
        var px = map.getPixelBounds();
        var distance = ll.getNorthWest().distanceTo(ll.getSouthWest());
        var height = px.getSize().y;

        // Assume accuracy is equivalent to the real-world length represented
        // by 2 pixels
        var accuracy = L.Util.formatNum(distance / height * 2, 3);

        self.update(evt.latlng, accuracy);
    }

    function _updateManual() {
        if (_mode != 'manual') {
            return;
        }
        self.update(L.latLng(
            fields.latitude.val(),
            fields.longitude.val()
        ), null);
    }

    function _getVal($input) {
        if ($input.is('select')) {
            return $input.val();
        } else if ($input.is('input[type=radio]')) {
            return $input.filter(':checked').val();
        }
        return null;
    }

    // Leaflet events
    map.on('click', _clickMap);

    // jQuery Events
    if (fields.toggle) {
        fields.toggle.on('click', function() {
            self.setMode(_getVal(fields.toggle));
        });
        self.setMode(_getVal(fields.toggle));
    }

    if (fields.latitude && fields.longitude) {
        fields.latitude.on('change', _updateManual);
        fields.longitude.on('change', _updateManual);
    }
};

// Leaflet-style generator function
locate.locator = function(map, fields, opts) {
    return new locate.Locator(map, fields, opts);
};

return locate;

});
