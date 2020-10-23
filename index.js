import app from '@wq/app';
import material from '@wq/material';
import mapbox from '@wq/mapbox';
import modules from './modules';

app.use([material, mapbox]);

export default app;

export { modules };
