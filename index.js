import app from '@wq/app';
import material from '@wq/material';
import mapgl from '@wq/map-gl';
import modules from './modules';
import version from './version';

app.use([material, mapgl]);

export default app;

export { modules, version };
