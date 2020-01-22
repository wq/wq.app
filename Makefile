all: js css scss

init:
	npm i
	npm run bootstrap
	mkdir -p js/wq
	mkdir -p css/wq
	mkdir -p scss/wq

js: js_wq js_lib

js_build: init
	npm run build

js_wq: js_build
	cp -p packages/app/dist/app.js* js/wq/
	cp -p packages/map/dist/locate.js* js/wq/
	cp -p packages/map/dist/map.js* js/wq/
	cp -p packages/map/dist/mapserv.js* js/wq/
	cp -p packages/model/dist/model.js* js/wq/
	cp -p packages/outbox/dist/outbox.js* js/wq/
	cp -p packages/app/dist/patterns.js* js/wq/
	cp -p packages/app/dist/photos.js* js/wq/
	cp -p packages/router/dist/router.js* js/wq/
	cp -p packages/app/dist/spinner.js* js/wq/
	cp -p packages/store/dist/store.js* js/wq/
	cp -p packages/template/dist/template.js* js/wq/

js_leaflet_draw:
	echo "define(['leaflet'], function(L) {" > js/leaflet.draw.js
	cat packages/map/node_modules/leaflet-draw/dist/leaflet.draw-src.js >> js/leaflet.draw.js
	echo "\n});" >> js/leaflet.draw.js

js_regenerator_runtime:
	echo "define(function() {" > js/regenerator-runtime.js
	cat node_modules/regenerator-runtime/runtime.js >> js/regenerator-runtime.js
	echo "\nreturn regeneratorRuntime;\n});" >> js/regenerator-runtime.js

js_lib: js_build js_leaflet_draw js_regenerator_runtime
	cp -p packages/map/node_modules/esri-leaflet/dist/esri-leaflet-debug.js js/esri-leaflet.js
	cp -p packages/jquery-mobile/node_modules/jquery/dist/jquery.js js/jquery.js
	cp -p packages/jquery-mobile/dist/jquery.mobile.js js/jquery.mobile.js
	cp -p packages/store/node_modules/redux/dist/redux.js js/redux.js
	cp -p packages/store/node_modules/redux-persist/dist/redux-persist.js js/redux-persist.js
	cp -p packages/store/node_modules/redux-logger/dist/redux-logger.js js/redux-logger.js
	cp -p packages/router/node_modules/redux-first-router/dist/redux-first-router.js js/redux-first-router.js
	cp -p packages/model/dist/redux-orm.js js/redux-orm.js
	cp -p packages/outbox/dist/redux-offline.js js/redux-offline.js
	cp -p packages/outbox/dist/json-forms.js js/json-forms.js
	cp -p packages/map/node_modules/leaflet/dist/leaflet-src.js js/leaflet.js
	cp -p packages/map/node_modules/leaflet.markercluster/dist/leaflet.markercluster-src.js js/leaflet.markercluster.js
	sed -i "s/'exports'/'exports', 'leaflet'/" js/leaflet.markercluster.js
	cp -p packages/map/node_modules/leaflet.wms/dist/leaflet.wms.js js/leaflet.wms.js
	cp -p packages/store/node_modules/localforage/dist/localforage.js js/localforage.js
	cp -p packages/template/node_modules/mustache/mustache.js js/mustache.js
	cp -p node_modules/requirejs/require.js js/require.js

css: init
	cp -a packages/jquery-mobile/css/* css/
	cp -p packages/app/css/app.css css/wq/app.css
	cp -a packages/map/node_modules/leaflet-draw/dist/leaflet.draw.css css/leaflet.draw.css
	cp -a packages/map/node_modules/leaflet-draw/dist/images/* css/images/
	cp -a packages/map/node_modules/leaflet/dist/leaflet.css css/leaflet.css
	cp -a packages/map/node_modules/leaflet/dist/images/* css/images/
	cat packages/map/node_modules/leaflet.markercluster/dist/*.css > css/leaflet.markercluster.css

scss: init
	cp -a packages/jquery-mobile/scss/* scss/wq/

clean:
	rm -rf js css scss
