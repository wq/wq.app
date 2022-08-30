all: wq.js

init:
	npm i
	mkdir -p static/app/js
	mkdir -p static/app/css

wq.js: init
	cd packages/material-web && npm run rollup
	cd ../../
	npm run rollup -- -c
	cp -p packages/app/css/wq.css static/app/css/wq.css
	cp -p node_modules/mapbox-gl/dist/mapbox-gl.css static/app/css/mapbox-gl.css
	cp -p node_modules/@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css static/app/css/mapbox-gl-draw.css

clean:
	rm -rf static
