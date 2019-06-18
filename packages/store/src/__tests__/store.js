import ds from '../store';

beforeAll(async () => {
    ds.init({
        service: 'http://localhost:8080/tests'
    });
    await ds.ready;
});

test('set and retrieve item', async () => {
    await ds.set('test-key', '1234');
    const result = await ds.get('test-key');
    expect(result).toBe('1234');
});

test('retrieve URL from server', async () => {
    const result = await ds.get('/items.json');
    expect(result).toHaveLength(3);
});
