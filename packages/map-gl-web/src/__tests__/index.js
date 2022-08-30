/**
 * @jest-environment jsdom
 */
import './createObjectURL.mock';
import mapgl from '../index';

test('it loads', () => {
    expect(mapgl.name).toBe('map-gl');
});
