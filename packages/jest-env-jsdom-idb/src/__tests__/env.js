/**
 * @jest-environment ./packages/jest-env-jsdom-idb
 */

import structuredClone from 'realistic-structured-clone';

test('IDB in environment', () => {
    expect(global.indexedDB).toBeTruthy();
});

test('Can clone Blob', () => {
    const blob1 = new Blob([1, 2, 3], { type: 'text/plain' });
    const blob2 = structuredClone(blob1);
    expect(blob1).toEqual(blob2);
});
