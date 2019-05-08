import jQM from '../jquery-mobile';

beforeAll(() => {
    global.jQuery = jQM();
});

test('jQuery in environment', () => {
    expect(global.jQuery).toBeTruthy();
});

test('jQuery Mobile in environment', () => {
    expect(global.jQuery.mobile).toBeTruthy();
});
