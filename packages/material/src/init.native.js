import { navRef, nav } from './hooks';

export function init() {
    const { router, store } = this.app;
    router.push = to => nav(to, router.routesMap, navRef.current, store);
}
