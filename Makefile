all: wq.js compat

init:
	npm i
	npm run bootstrap
	mkdir -p static/app/js
	mkdir -p static/app/css

wq.js: init
	cd packages/material && npm run rollup
	cd ../../
	npm run rollup -- -c
	cp -p packages/app/css/wq.css static/app/css/wq.css
	cp -p packages/map-gl/node_modules/mapbox-gl/dist/mapbox-gl.css static/app/css/mapbox-gl.css
	cp -p packages/map-gl/node_modules/@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css static/app/css/mapbox-gl-draw.css

compat: init
	mkdir -p js/wq
	mkdir -p css/wq
	mkdir -p scss/wq
	npm run rollup-all
	cp -p packages/jquery-mobile/compat/*.js js/wq/
	echo "define(['leaflet'], function(L) {" > js/leaflet.draw.js
	cat packages/leaflet/node_modules/leaflet-draw/dist/leaflet.draw-src.js >> js/leaflet.draw.js
	echo "\n});" >> js/leaflet.draw.js
	echo "define(function() {" > js/regenerator-runtime.js
	cat node_modules/regenerator-runtime/runtime.js >> js/regenerator-runtime.js
	echo "\nreturn regeneratorRuntime;\n});" >> js/regenerator-runtime.js
	cp -p packages/react/node_modules/react/umd/react.production.min.js js/react.js
	cp -p packages/react/node_modules/react-dom/umd/react-dom.production.min.js js/react-dom.js
	cp -p packages/react/node_modules/react-is/umd/react-is.production.min.js js/react-is.js
	cp -p packages/react/node_modules/scheduler/umd/scheduler.production.min.js js/scheduler.js
	cp -p packages/react/node_modules/prop-types/prop-types.min.js js/prop-types.js
	cp -p packages/react/node_modules/react-redux/dist/react-redux.js js/react-redux.js
	cp -p packages/app/node_modules/deepcopy/umd/deepcopy.js js/deepcopy.js
	cp -p packages/leaflet/node_modules/esri-leaflet/dist/esri-leaflet-debug.js js/esri-leaflet.js
	cp -p packages/jquery-mobile/node_modules/jquery/dist/jquery.js js/jquery.js
	cp -p packages/store/node_modules/redux/dist/redux.js js/redux.js
	cp -p packages/store/node_modules/redux-persist/dist/redux-persist.js js/redux-persist.js
	cp -p packages/store/node_modules/redux-logger/dist/redux-logger.js js/redux-logger.js
	cp -p packages/router/node_modules/redux-first-router/dist/redux-first-router.js js/redux-first-router.js
	cp -p packages/react/node_modules/redux-first-router-link/dist/redux-first-router-link.js js/redux-first-router-link.js
	cp -p packages/leaflet/node_modules/leaflet/dist/leaflet-src.js js/leaflet.js
	cp -p packages/leaflet/node_modules/leaflet.markercluster/dist/leaflet.markercluster-src.js js/leaflet.markercluster.js
	sed -i "s/'exports'/'exports', 'leaflet'/" js/leaflet.markercluster.js
	cp -p packages/leaflet/node_modules/leaflet.wms/dist/leaflet.wms.js js/leaflet.wms.js
	cp -p packages/store/node_modules/localforage/dist/localforage.js js/localforage.js
	cp -p packages/jquery-mobile/node_modules/mustache/mustache.js js/mustache.js
	cp -p node_modules/requirejs/require.js js/require.js
	cp -a packages/jquery-mobile/css/* css/
	cp -p packages/app/css/app.css css/wq/app.css
	cp -a packages/leaflet/node_modules/leaflet-draw/dist/leaflet.draw.css css/leaflet.draw.css
	cp -a packages/leaflet/node_modules/leaflet-draw/dist/images/* css/images/
	cp -a packages/leaflet/node_modules/leaflet/dist/leaflet.css css/leaflet.css
	cp -a packages/leaflet/node_modules/leaflet/dist/images/* css/images/
	cat packages/leaflet/node_modules/leaflet.markercluster/dist/*.css > css/leaflet.markercluster.css
	cp -a packages/jquery-mobile/scss/* scss/wq/

clean:
	rm -rf js css scss static
