@wq/leaflet
======

[@wq/leaflet][source]

**@wq/leaflet** is a plugin for [@wq/app] that provides integration with [Leaflet].   When used together with [@wq/map], @wq/leaflet can leverage the [wq configuration object][config] to generate interactive maps for pages rendered via @wq/app.  The generated maps can automatically download and display GeoJSON data rendered by [wq.db's REST API][wq.db] or any third party service.

# Installation

## wq.app for PyPI

```bash
python3 -m venv venv      # create virtual env (if needed)
. venv/bin/activate       # activate virtual env
python3 -m pip install wq # install wq framework (wq.app, wq.db, etc.)
# pip install wq.app      # install wq.app only
```

## @wq/leaflet for npm

```bash
npm install @wq/leaflet  # install @wq/leaflet, @wq/map, and deps
```

# API

@wq/leaflet should be registered with @wq/app as a plugin.  @wq/map will be registered automatically.  To enable @wq/leaflet's [ESRI and WMS layer support](#basemap-components), import `@wq/leaflet/mapserv` instead of `@wq/leaflet`.

```javascript
import app from '@wq/app';
import leaflet from '@wq/leaflet'; // Or @wq/leaflet/mapserv

app.use(leaflet);  // Automatically registers @wq/map

app.init(...);
```

@wq/leaflet consists primarily of React components that override the placeholders defined in [@wq/map].  The components in @wq/leaflet extend the existing [react-leaflet] library.

## Configuration

@wq/leaflet relies on [@wq/map]'s configuration and conventions, as well as two additional options to configure popup content and marker icons.

```javascript
app.init({
  // @wq/map config
  "map": {
    "bounds": [[-4, -4], [4, 4]
  },
  
  // @wq/leaflet config
  "leaflet": {
    "popups": {
      "item": "<h3>{{label}}</h3><p>{{description}}</p>"
    }
  },
  
  // @wq/jquery-mobile config (backwards compatibility)
  /*
  "jqmrenderer": {
    "templates": {
      "item_popup": "<h3>{{label}}</h3><p>{{description}}</p>"
    }
  },
  */
  
  // @wq/app pages & routes
  "pages": {
    "item": {
      "url": "items",
      "list": true,
      "form": [ ... ],
      "map": [{
        "mode": "list",
        "layers": [{
           // @wq/map general overlay props
           "name": "Items",
           "type": "geojson",
           
           // @wq/leaflet-specific props
           "popup": "item",
           "icon": "{{#flag}}red{{/flag}}{{^flag}}default{{/flag}}"
        }]
      }],
      ...
    }
  }
});
```

### Popups

Popups are specified as [Mustache] templates that are rendered with the properties of the features in a GeoJSON layer.  Popup templates can be defined via `config.leaflet.popups`.  Then, the configuration for each [Geojson layer](#overlay-components) can specify a template name as the `popup` property.  For backwards compatibility with [@wq/map 1.2] and earlier, @wq/leaflet will also check the [@wq/jquery-mobile] template list for any templates ending in `*_popup`.

### Marker Icons

Marker icons are instances of [L.Icon] for use in layer configurations.  While it is possible to define icons directly via `config.leaflet.icons`, it is more convenient to use the `leaflet.createIcon(name, options)` method, which includes built-in defaults for `options` that are optimized to make it trivial to define icons that have the same dimensions and shadow as Leaflet's default icon:

name | default
-----|---------
`iconSize` | `[25, 41]`
`iconAnchor` | `[12, 41]`
`popupAnchor` | `[1, -34]`
`shadowSize` | `[41, 41]`
`shadowUrl` | `L.Icon.Default.imagePath + '/marker-shadow.png'`

```javascript
import app from '@wq/app';
import leaflet from '@wq/leaflet';
import config from './config';

leaflet.createIcon("green", {'iconUrl': "/images/red.png"});

app.init(config).then(...)
```

`leaflet.createIcon()` should be called during application startup, i.e. preferably before or right after `init()`.  With the icons defined, the configuration for each [Geojson layer](#overlay-components) can specify `icon` as:

 * the name of an icon to use
 * a Mustache template that will compile to an icon name (as in the example above), 
 * or a function returning an icon name.
 
If a template or a function, it will be called with the `feature.properties` for each feature in the dataset.

# Components

@wq/leaflet provides implementations of the components defined by [@wq/map].

plugin key | description
--|--
[components](#general-components) | High-level map components (Map, Legend, etc.)
[basemaps](#basemap-components) | Basemap layers, typically tiled imagery or road network
[overlays](#overlay-components) | Overlay layers, such as GeoJSON vectors

## General Components

See [@wq/map] for more info.

name | details
--|--
[Map] | Top level component that renders [react-leaflet]'s `<Map/>`
[Legend] | Wrapper for react-leaflet's `<LayersControl/>`
[BasemapToggle][Legend] | Wrapper for react-leaflet's `<LayersControl.BaseLayer/>`
[OverlayToggle][Legend] | Wrapper for react-leaflet's `<LayersControl.Overlay/>`
MapInteraction | Not overridden by @wq/leaflet

## Basemap Components

See [basemap components][basemaps] for more info.  @wq/leaflet implements the default `tile`, `empty`, and `group` layer types.  @wq/leaflet/mapserv also provides a few additional basemap types via [esri-leaflet] and [react-leaflet]

config name | component | details
--|--|--
tile | [Tile] | Raster tile layer, typically with 256x256 tile images in "Web Mercator" projection
empty | Empty | Provides an option to completely disable the basemap.
group | Group | Treats a group of related layers as a single basemap.  The configuration for the group should specify a `layers` array containing one or more basemap layer configurations.
esri-basemap* | [EsriBasemap] | Renders one of the named [Esri basemaps][esri-leaflet] with optional labels.
esri-tiled*  | [EsriTiled] | Renders a custom [Esri TiledMapLayer][esri-leaflet]
wms-tiled* | [WmsTiled] | Requests tiles from a [WMS service][react-leaflet]

Options marked with * are only available by importing `@wq/leaflet/mapserv` instead of `@wq/leaflet`

## Overlay Components

See [overlay components][overlays] for more info.  @wq/leaflet implements the default `geojson`, `empty`, and `group` layer types.  @wq/leaflet/mapserv also provides a few additional overlay types from [esri-leaflet] and [leaflet.wms]

config name | component | details
--|--|--
geojson | [Geojson] | GeoJSON overlay.  If a URL is provided it will be retrieved and loaded
empty | Empty | Non-rendered layer that essentially is just to provide a toggle-able entry in the legend.  (Typically used with a custom component somewhere else in the tree that calls [`useMapState()`][useMapState] and renders accordingly)
group | Group | Treats a group of related layers as a single overlay.  The configuration for the group should specify a `layers` array containing one or more overlay configurations.
esri-dynamic* | [EsriDynamic] | Renders custom [Esri dynamic][esri-leaflet] (non-tiled) map imagery
esri-feature*  | [EsriFeature] | Renders custom [Esri feature][esri-leaflet] vectors
wms* | [Wms] | Non-tiled [WMS service][leaflet.wms]
n/a | [Highlight] | GeoJSON overlay with preset highlight styles, which renders the contents (if any) of `useMapState().highlight`
n/a | [Draw] | Drawing tools based on [react-leaflet-draw]

Options marked with * are only available by importing `@wq/leaflet/mapserv` instead of `@wq/leaflet`

[source]: https://github.com/wq/wq.app/tree/main/packages/leaflet

[@wq/app]: https://wq.io/@wq/app
[@wq/map]: https://wq.io/@wq/map
[@wq/map 1.2]: https://v1.wq.io/docs/map-js
[@wq/react]: https://wq.io/@wq/react
[@wq/material]: https://wq.io/@wq/material
[@wq/jquery-mobile]: https://github.com/wq/wq.app/tree/main/packages/jquery-mobile

[Leaflet]: https://leafletjs.com
[react-leaflet]: https://react-leaflet.js.org/
[react-leaflet-draw]: https://github.com/alex3165/react-leaflet-draw
[esri-leaflet]: https://esri.github.io/esri-leaflet/
[leaflet.wms]: https://github.com/heigeo/leaflet.wms
[Mustache]: https://github.com/janl/mustache.js
[L.Icon]: http://leafletjs.com/reference.html#icon

[wq.db]: https://wq.io/wq.db/
[config]: https://wq.io/config
[basemaps]: https://wq.io/basemaps/
[overlays]: https://wq.io/overlays/
[useMapState]: https://wq.io/hooks/useMapState

[Map]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/components/Map.js
[Legend]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/components/Legend.js

[Tile]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/basemaps/Tile.js
[EsriBasemap]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/basemaps/EsriBasemap.js
[EsriTiled]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/basemaps/EsriTiled.js
[WmsTiled]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/basemaps/WmsTiled.js

[Geojson]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/overlays/Geojson.js
[EsriDynamic]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/overlays/EsriDynamic.js
[EsriFeature]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/overlays/EsriFeature.js
[Wms]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/overlays/Wms.js
[Highlight]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/overlays/Highlight.js
[Draw]: https://github.com/wq/wq.app/blob/main/packages/leaflet/src/overlays/Draw.js
