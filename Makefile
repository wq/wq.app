all: js css scss

init:
	npm i
	npm run bootstrap
	mkdir -p js/wq
	mkdir -p css/wq
	mkdir -p scss/wq

js: js_wq js_lib js_compat

js_wq: init
        # TODO wq/app.js
        # TODO wq/chart.js
        # TODO wq/chartapp.js
        # TODO wq/locate.js
        # TODO wq/map.js
        # TODO wq/mapserv.js
        # TODO wq/markdown.js
        # TODO wq/model.js
        # TODO wq/outbox.js
        # TODO wq/pandas.js
        # TODO wq/patterns.js
        # TODO wq/photos.js
        # TODO wq/router.js
        # TODO wq/spinner.js
        # TODO wq/store.js
        # TODO wq/template.js

js_lib: init
	cp -p packages/chart/node_modules/d3/dist/d3.js js/d3.js
	cp -p packages/map/node_modules/esri-leaflet/dist/esri-leaflet-debug.js js/esri-leaflet.js
	# TODO: higlight.js
	cp -p packages/jquery-mobile/node_modules/jquery/dist/jquery.js js/jquery.js
	# TODO: jquery.mobile.js
	# TODO: jquery.mobile.router.js
	# TODO: json-forms.js
	cp -p packages/map/node_modules/leaflet-draw/dist/leaflet.draw-src.js js/leaflet.draw.js
	cp -p packages/map/node_modules/leaflet/dist/leaflet-src.js js/leaflet.js
	cp -p packages/map/node_modules/leaflet.markercluster/dist/leaflet.markercluster-src.js js/leaflet.markercluster.js
	cp -p packages/map/node_modules/leaflet.wms/dist/leaflet.wms.js js/leaflet.wms.js
	# TODO: localforage-memoryStorageDriver.js
	# TODO: localforage.js
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
