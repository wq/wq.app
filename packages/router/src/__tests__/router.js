import router from "../../index.js";

var handleRender;

beforeAll(() => {
    router.init({
        debug: true,
    });
    router.store.init();
    router.register("test/<slug>", "test_detail");
    router.addThunk("RENDER", (dispatch, getState, bag) => {
        const { action } = bag,
            { payload: context } = action;
        handleRender(context);
    });
    router.start();
});

test("render page", () => {
    return new Promise((done) => {
        router.addContextForRoute("test/<slug>", async (ctx) => {
            await new Promise((resolve) => setTimeout(resolve, 200));
            return {
                title: ctx.router_info.slugs.slug,
                params: JSON.stringify(ctx.router_info.params),
            };
        });

        handleRender = (context) => {
            expect(context.title).toBe("1234");
            expect(context.params).toBe('{"p":"1"}');
            done();
        };

        router.push("/test/1234?p=1");
    });
});

test("match path", () => {
    expect(router.matchPath("/", "/")).toBe(true);
    expect(router.matchPath("/test", "/test/")).toBe(true);
    expect(router.matchPath("/test", "/")).toBe(false);
    expect(router.matchPath("/test/:slug", "/test/1234")).toBe(true);
    expect(router.matchPath("/test/", "/test/1234")).toBe(false);
    expect(router.matchPath("/test/1234", "/test/:slug")).toBe(true);
    expect(router.matchPath("/test/1234", "/test/5678")).toBe(false);
});
