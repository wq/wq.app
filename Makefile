all: wq.js

init:
	npm i
	mkdir -p static/app/js
	mkdir -p static/app/css

wq.js: init
	npm run rollup -- -c
	cp -p packages/app/css/wq.css static/app/css/wq.css
	cp -p node_modules/maplibre-gl/dist/maplibre-gl.js* static/app/js/
	cp -p node_modules/maplibre-gl/dist/maplibre-gl.css* static/app/css/
	cp -p node_modules/@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css* static/app/css/

clean:
	rm -rf static
