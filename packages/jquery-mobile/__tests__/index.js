/**
 * @jest-environment ./packages/jquery-mobile/env
 */

test("jQuery in environment", () => {
    expect(global.jQuery).toBeTruthy();
});

test("jQuery Mobile in environment", () => {
    expect(global.jQuery.mobile).toBeTruthy();
});
