import app from '@wq/app';
import material from '@wq/material';
import mapgl from '@wq/map-gl';
import modules from './modules';

app.use([material, mapgl]);

export default app;

export { modules };
