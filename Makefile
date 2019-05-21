all: js css scss

init:
	npm i
	npm run bootstrap
	mkdir -p js/wq
	mkdir -p css/wq
	mkdir -p scss/wq

js: js_wq js_lib js_compat

js_build: init
	npm run build

js_wq: js_build
	cp -p packages/app/dist/app.js js/wq/app.js
	cp -p packages/chart/dist/chart.js js/wq/chart.js
	cp -p packages/chart/dist/chartapp.js js/wq/chartapp.js
	cp -p packages/map/dist/locate.js js/wq/locate.js
	cp -p packages/map/dist/map.js js/wq/map.js
	cp -p packages/map/dist/mapserv.js js/wq/mapserv.js
	cp -p packages/markdown/dist/markdown.js js/wq/markdown.js
	cp -p packages/model/dist/model.js js/wq/model.js
	cp -p packages/outbox/dist/outbox.js js/wq/outbox.js
	cp -p packages/chart/dist/pandas.js js/wq/pandas.js
	cp -p packages/app/dist/patterns.js js/wq/patterns.js
	cp -p packages/app/dist/photos.js js/wq/photos.js
	cp -p packages/router/dist/router.js js/wq/router.js
	cp -p packages/app/dist/spinner.js js/wq/spinner.js
	cp -p packages/store/dist/store.js js/wq/store.js
	cp -p packages/template/dist/template.js js/wq/template.js

js_leaflet_draw:
	echo "define(['leaflet'], function(L) {" > js/leaflet.draw.js
	cat packages/map/node_modules/leaflet-draw/dist/leaflet.draw-src.js >> js/leaflet.draw.js
	echo "\n});" >> js/leaflet.draw.js

js_lib: js_build js_leaflet_draw
	cp -p packages/chart/node_modules/d3/dist/d3.js js/d3.js
	cp -p packages/map/node_modules/esri-leaflet/dist/esri-leaflet-debug.js js/esri-leaflet.js
	cp -p packages/markdown/dist/highlight.js js/highlight.js
	cp -p packages/jquery-mobile/node_modules/jquery/dist/jquery.js js/jquery.js
	cp -p packages/jquery-mobile/dist/jquery.mobile.js js/jquery.mobile.js
	cp -p packages/router/dist/jquery.mobile.router.js js/jquery.mobile.router.js
	cp -p packages/outbox/dist/json-forms.js js/json-forms.js
	cp -p packages/map/node_modules/leaflet/dist/leaflet-src.js js/leaflet.js
	cp -p packages/map/node_modules/leaflet.markercluster/dist/leaflet.markercluster-src.js js/leaflet.markercluster.js
	cp -p packages/map/node_modules/leaflet.wms/dist/leaflet.wms.js js/leaflet.wms.js
	cp -p packages/store/node_modules/localforage-memoryStorageDriver/dist/localforage-memoryStorageDriver.js js/localforage-memoryStorageDriver.js
	cp -p packages/store/node_modules/localforage/dist/localforage.js js/localforage.js
	cp -p packages/markdown/node_modules/marked/lib/marked.js js/marked.js
	cp -p packages/template/node_modules/mustache/mustache.js js/mustache.js
	cp -p node_modules/requirejs/require.js js/require.js

V1_URL = https://raw.githubusercontent.com/wq/wq.app/v1.1.1/js

js_compat: init
	curl -s $(V1_URL)/wq/autocomplete.js > js/wq/autocomplete.js
	curl -s $(V1_URL)/wq/console.js > js/wq/console.js
	curl -s $(V1_URL)/wq/json.js > js/wq/json.js
	curl -s $(V1_URL)/wq/progress.js > js/wq/progress.js
	curl -s $(V1_URL)/qunit.js > js/qunit.js

css: init
	cp -a packages/jquery-mobile/css/* css/
	cp -p packages/app/css/app.css css/wq/app.css
	cp -a packages/map/node_modules/leaflet-draw/dist/leaflet.draw.css css/leaflet.draw.css
	cp -a packages/map/node_modules/leaflet-draw/dist/images/* css/images/
	cp -a packages/map/node_modules/leaflet/dist/leaflet.css css/leaflet.css
	cp -a packages/map/node_modules/leaflet/dist/images/* css/images/
	cat packages/map/node_modules/leaflet.markercluster/dist/*.css > css/leaflet.markercluster.css
	cp -p packages/markdown/node_modules/highlight.js/styles/github.css css/highlight.css

scss: init
	cp -a packages/jquery-mobile/scss/* scss/wq/

clean:
	rm -rf js css scss
