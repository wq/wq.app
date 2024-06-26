import { mergeErrors } from "../outbox.js";

test("merge errors - simple", () => {
    const error1 = { test: "invalid data" },
        error2 = { test: "required", test2: "required" },
        merged1 = { test: "invalid data • required", test2: "required" },
        merged2 = { test: "required • invalid data", test2: "required" };
    expect(mergeErrors(error1, error2)).toStrictEqual(merged1);
    expect(mergeErrors(error2, error1)).toStrictEqual(merged2);
});

test("merge errors - array", () => {
    const error1 = { test: [null, { value: "invalid data" }] },
        error2 = { test: [{ value: "required" }, { value: "required" }] },
        merged1 = {
            test: [{ value: "required" }, { value: "invalid data • required" }],
        },
        merged2 = {
            test: [{ value: "required" }, { value: "required • invalid data" }],
        };
    expect(mergeErrors(error1, error2)).toStrictEqual(merged1);
    expect(mergeErrors(error2, error1)).toStrictEqual(merged2);
});

test("merge errors - mixed types", () => {
    const error1 = { test: [null, { value: "invalid data" }] },
        error2 = { test: "error" };
    expect(mergeErrors(error1, error2)).toStrictEqual(error2);
    expect(mergeErrors(error2, error1)).toStrictEqual(error1);
});

test("merge errors - nested array", () => {
    const error1 = {
            test: [null, { items: [null, { value: "invalid data" }] }],
        },
        error2 = {
            test: [
                null,
                { items: [{ value: "required" }, { value: "required" }] },
            ],
        },
        merged1 = {
            test: [
                {},
                {
                    items: [
                        { value: "required" },
                        { value: "invalid data • required" },
                    ],
                },
            ],
        },
        merged2 = {
            test: [
                {},
                {
                    items: [
                        { value: "required" },
                        { value: "required • invalid data" },
                    ],
                },
            ],
        };
    expect(mergeErrors(error1, error2)).toStrictEqual(merged1);
    expect(mergeErrors(error2, error1)).toStrictEqual(merged2);
});

test("merge errors - diff array length", () => {
    const error1 = { test: [null, { value: "invalid data" }] },
        error2 = { test: [{ value: "required" }] },
        merged = {
            test: [{ value: "required" }, { value: "invalid data" }],
        };
    expect(mergeErrors(error1, error2)).toStrictEqual(merged);
    expect(mergeErrors(error2, error1)).toStrictEqual(merged);
});
