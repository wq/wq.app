import app from "@wq/app";
import material from "@wq/material";
import mapgl from "@wq/map-gl";
import modules from "./modules.js";
import version from "./version.js";
import maplibre from "maplibre-gl";

mapgl.setEngine(maplibre);

app.use([material, mapgl]);

export default app;

export { modules, version };
