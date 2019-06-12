import ds from '../store';

beforeAll(() => {
    ds.init();
});

test('set and retrieve item', async () => {
    await ds.set('test-key', '1234');
    const result = await ds.get('test-key');
    expect(result).toBe('1234');
});
