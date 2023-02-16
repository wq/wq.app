/**
 * @jest-environment jsdom
 */
import mapgl from "../index.js";

test("it loads", () => {
    expect(mapgl.name).toBe("map-gl");
});
