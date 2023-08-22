import React from "react";
import map from "../map.js";
import {
    routeMapConf,
    contextFeature,
    contextFeatureCollection,
} from "../hooks.js";
import { AutoMap } from "../components/index.js";
import { Geo } from "../inputs/index.js";
import react, { Form } from "@wq/react";
import renderTest from "@wq/react/test";
import routeConfig from "./config.json";
import geojson from "./geojson.json";
import { createStore, combineReducers, bindActionCreators } from "redux";

const { Geojson, Draw, Highlight } = map.registry.overlays;

const store = createStore(
    combineReducers({
        map(state, action) {
            return map.reducer(state, action);
        },
        routeInfo(state = {}, action) {
            if (action.type === "RENDER") {
                return { "@@CURRENT": action.payload.router_info };
            } else {
                return state;
            }
        },
        context(state = {}, action) {
            if (action.type === "RENDER") {
                return { "@@CURRENT": action.payload };
            } else {
                return state;
            }
        },
    })
);
Object.assign(map, bindActionCreators(map.actions, store.dispatch.bind(store)));

const defaultRegistry = react.registry;

const mockApp = {
    config: routeConfig,
    spin: {
        start: () => {},
        stop: () => {},
    },
    store: {
        _store: store,
        ajax: () => {
            return Promise.resolve(geojson);
        },
    },
    router: {
        getRouteInfo(context, routeInfo) {
            return context.router_info || routeInfo;
        },
    },
    plugins: { map, defaultRegistry },
};

beforeAll(() => {
    Object.keys(mockApp.config.pages).forEach(
        (key) => (mockApp.config.pages[key].name = key)
    );
    map.app = mockApp;
    map.init(routeConfig.map);
});

function getLayerConfs(routeInfo) {
    return routeMapConf(map.config, routeWithPath(routeInfo)).layers;
}

function routeWithPath(routeInfo) {
    const { page, mode, item_id, outbox_id } = routeInfo;
    let path = routeConfig.pages[page].url;
    if (mode === "list") {
        path = `${path}/`;
    } else if (mode === "detail") {
        path = `${path}/${item_id}`;
    } else if (mode) {
        path = `${path}/${item_id}/${mode}`;
    }
    return {
        name: page,
        page,
        mode,
        item_id,
        outbox_id,
        path,
        page_config: routeConfig.pages[page],
    };
}

function setRouteInfo(routeInfo, context = {}) {
    store.dispatch({
        type: "RENDER",
        payload: {
            ...context,
            router_info: routeWithPath(routeInfo),
        },
    });
}

test("auto map config for list pages", () => {
    expect(
        getLayerConfs({
            page: "item",
            mode: "list",
        })
    ).toEqual([
        {
            type: "geojson",
            name: "item",
            active: true,
            data: ["context_feature_collection", "geometry"],
            popup: "item",
            cluster: true,
        },
    ]);
    expect(
        getLayerConfs({
            page: "item",
            mode: "detail",
            item_id: "one",
        })
    ).toEqual([
        {
            type: "geojson",
            name: "item",
            active: true,
            popup: "item",
            data: ["context_feature", "geometry"],
        },
    ]);
    expect(
        getLayerConfs({
            page: "item",
            mode: "edit",
            item_id: "one",
        })
    ).toEqual([]);
    expect(
        getLayerConfs({
            page: "itemmulti",
            mode: "list",
        })
    ).toEqual([
        {
            type: "geojson",
            name: "itemmulti - location",
            active: true,
            popup: "itemmulti",
            cluster: true,
            data: ["context_feature_collection", "observations[].location"],
        },
    ]);
});

test("context geojson fields", () => {
    expect(
        contextFeatureCollection(
            {
                list: [
                    {
                        id: "one",
                        geometry: { type: "Point", coordinates: [0, 0] },
                    },
                ],
            },
            "geometry"
        )
    ).toEqual({
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                id: "one",
                geometry: { type: "Point", coordinates: [0, 0] },
                properties: {
                    id: "one",
                    geometry: { type: "Point", coordinates: [0, 0] },
                },
            },
        ],
    });

    expect(
        contextFeature(
            {
                id: "one",
                geometry: { type: "Point", coordinates: [0, 0] },
            },
            "geometry"
        )
    ).toEqual({
        type: "Feature",
        id: "one",
        geometry: { type: "Point", coordinates: [0, 0] },
        properties: {
            id: "one",
            geometry: { type: "Point", coordinates: [0, 0] },
        },
    });

    expect(
        contextFeatureCollection(
            {
                list: [
                    {
                        id: 1,
                        general: {
                            name: "Test 1",
                            geometry: {
                                type: "Point",
                                coordinates: [0, 0],
                            },
                        },
                    },
                ],
            },
            "general.geometry"
        )
    ).toEqual({
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                id: 1,
                geometry: { type: "Point", coordinates: [0, 0] },
                properties: {
                    id: 1,
                    general: {
                        name: "Test 1",
                        geometry: {
                            type: "Point",
                            coordinates: [0, 0],
                        },
                    },
                },
            },
        ],
    });

    const itemWithObservations = {
        id: 1,
        name: "Test 1",
        observations: [
            {
                notes: "Observation 1",
                location: {
                    type: "Point",
                    coordinates: [0, 0],
                },
            },
            {
                notes: "Observation 2",
                location: {
                    type: "Point",
                    coordinates: [1, 1],
                },
            },
        ],
    };
    expect(
        contextFeatureCollection(
            {
                list: [itemWithObservations],
            },
            "observations[].location"
        )
    ).toEqual({
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                id: 1,
                geometry: {
                    type: "GeometryCollection",
                    geometries: [
                        { type: "Point", coordinates: [0, 0] },
                        { type: "Point", coordinates: [1, 1] },
                    ],
                },
                properties: itemWithObservations,
            },
        ],
    });
});

const expectedLayers = [
    {
        type: "geojson",
        name: "Map Test",
        active: true,
        url: "test.geojson",
    },
];

test("manual map config for list pages", () => {
    expect(
        getLayerConfs({
            page: "listmap1",
            mode: "list",
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: "listmap2",
            mode: "list",
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: "listmap3",
            mode: "list",
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: "listmap3",
            mode: "detail",
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: "listmap4",
            mode: "list",
        })
    ).toEqual(expectedLayers);

    // FIXME: Restore multiple map support
    /*
    expect(
        getLayerConfs(
            {
                page: 'listmap4',
                mode: 'list'
            },
            'second'
        )
    ).toEqual([
        {
            type: 'geojson',
            name: 'Map Test2',
            url: 'test2.geojson'
        }
    ]);
    */
});

test("manual map config for other pages", () => {
    expect(
        getLayerConfs({
            page: "othermap1",
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: "othermap2",
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: "othermap3",
        })
    ).toEqual(expectedLayers);
});

test("list map", async () => {
    const context = {
        list: [
            {
                id: "one",
                geometry: { type: "Point", coordinates: [0, 0] },
            },
        ],
    };
    setRouteInfo(
        {
            page: "item",
            mode: "list",
        },
        context
    );

    const result = renderTest(() => <AutoMap context={context} />, mockApp),
        overlay = result.root.findByType(Geojson);

    expect(overlay.props).toEqual({
        name: "item",
        popup: "item",
        data: {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    id: "one",
                    geometry: { type: "Point", coordinates: [0, 0] },
                    properties: {
                        id: "one",
                        geometry: { type: "Point", coordinates: [0, 0] },
                    },
                },
            ],
        },
        cluster: true,
        active: true,
    });

    result.unmount();
});

test("edit map", async () => {
    const point = {
        type: "Point",
        coordinates: [45, -95],
    };

    setRouteInfo(
        {
            page: "item",
            mode: "edit",
            item_id: 123,
            outbox_id: 1,
        },
        {
            geometry: point,
        }
    );

    const Component = () => (
        <Form data={{ point: point }}>
            <Geo type="geopoint" name="point" />
        </Form>
    );

    const result = renderTest(Component, mockApp),
        overlay = result.root.findByType(Draw);

    const { type, data } = overlay.props;
    expect(type).toEqual("point");
    expect(data).toEqual({
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                properties: {},
                geometry: point,
            },
        ],
    });

    result.unmount();
});

test("special layer types", async () => {
    setRouteInfo({
        page: "special",
    });

    const result = renderTest(AutoMap, mockApp),
        overlays = result.root
            .findAllByType(Geojson)
            .map((overlay) => overlay.props);

    expect(overlays).toHaveLength(2);
    expect(overlays[0]).toEqual({
        name: "Group 1-0",
        active: true,
        url: "layer1.geojson",
    });
    expect(overlays[1]).toEqual({
        name: "Group 1-1",
        active: true,
        url: "layer2.geojson",
    });

    result.unmount();
});

test("toggle layers", async () => {
    setRouteInfo({
        page: "multilayer",
    });
    const { routes, ...currentMapState } = store.getState().map,
        expectedMapState = {
            routeName: "multilayer",
            basemaps: [
                {
                    name: "Basemap 1",
                    type: "tile",
                    url: "http://example.org/street/{z}/{x}/{y}.png",
                    active: true,
                },
                {
                    name: "Basemap 2",
                    url: "http://example.org/aerial/{z}/{x}/{y}.png",
                    type: "tile",
                    active: false,
                },
            ],
            overlays: [
                {
                    name: "Layer 1",
                    type: "geojson",
                    url: "layer1.geojson",
                    active: true,
                },
                {
                    name: "Layer 2",
                    type: "geojson",
                    url: "layer2.geojson",
                    active: true,
                },
                {
                    name: "Layer 3",
                    type: "geojson",
                    url: "layer3.geojson",
                    active: false,
                },
            ],
            viewState: null,
            initBounds: [
                [-4, -4],
                [4, 4],
            ],
            autoZoom: {
                wait: 0.5,
                maxZoom: 13,
                animate: true,
            },
            mapProps: undefined,
            mapId: undefined,
            highlight: null,
        };

    expect(currentMapState).toEqual(expectedMapState);
    expect(routes.multilayer).toEqual(expectedMapState);

    map.setBasemap("Basemap 2");
    expect(store.getState().map.basemaps).toEqual([
        {
            name: "Basemap 1",
            type: "tile",
            url: "http://example.org/street/{z}/{x}/{y}.png",
            active: false,
        },
        {
            name: "Basemap 2",
            url: "http://example.org/aerial/{z}/{x}/{y}.png",
            type: "tile",
            active: true,
        },
    ]);

    map.hideOverlay("Layer 2");
    map.showOverlay("Layer 3");

    expect(store.getState().map.overlays).toEqual([
        {
            name: "Layer 1",
            type: "geojson",
            url: "layer1.geojson",
            active: true,
        },
        {
            name: "Layer 2",
            type: "geojson",
            url: "layer2.geojson",
            active: false,
        },
        {
            name: "Layer 3",
            type: "geojson",
            url: "layer3.geojson",
            active: true,
        },
    ]);
});

test("highlight layer", async () => {
    setRouteInfo({
        page: "multilayer",
    });

    const geojson = {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [45, -95],
                },
            },
        ],
    };

    map.setHighlight(geojson);

    const result = renderTest(AutoMap, mockApp),
        overlay = result.root.findByType(Highlight);

    expect(overlay.props.data).toEqual(geojson);

    result.unmount();
});
