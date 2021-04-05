@wq/store
========

[@wq/store][docs]

**@wq/store** is a [wq.app] module providing a persistent storage API for retrieving and querying JSON data from a web service via AJAX.  @wq/store is used internally by [@wq/app] to store model data (via [@wq/model]) and application configuration.  @wq/store relies extensively on [Redux] to manage state, with [Redux Persist] and [localForage] to handle the work of storing data offline in IndexedDB.

@wq/store is almost always used in conjunction with [@wq/outbox] to sync local changes (i.e., form submissions) back to the server.

### [Documentation][docs]

[**Installation**][installation]
&bull;
[**API**][api]
&bull;
[Query Objects][query-objects]
&bull;
[**Configuration**][configuration]
&bull;
[**Plugins**][plugin-types]
&bull;
[**Methods**][methods]

[docs]: https://wq.io/@wq/store
[installation]: https://wq.io/@wq/store#installation
[api]: https://wq.io/@wq/store#api
[query-objects]: https://wq.io/@wq/store#query-objects
[configuration]: https://wq.io/@wq/store#configuration
[plugin-types]: https://wq.io/@wq/store#plugin-types
[methods]: https://wq.io/@wq/store#methods

[wq.app]: https://wq.io/wq.app/
[@wq/app]: https://wq.io/@wq/app
[@wq/model]: https://wq.io/@wq/model
[@wq/outbox]: https://wq.io/@wq/outbox

[Redux]: https://redux.js.org/
[Redux Persist]: https://github.com/rt2zz/redux-persist
[localForage]: https://mozilla.github.io/localForage/
