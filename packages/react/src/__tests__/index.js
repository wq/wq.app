import reactRenderer from "../index.js";

test("it loads", () => {
    expect(reactRenderer.name).toBe("react");
});
