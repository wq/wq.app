all: wq.js

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

clean:
	rm -rf static
