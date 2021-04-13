[![@wq/outbox][logo]][docs]

**@wq/outbox** is a [wq.app] module providing an offline-cabable "outbox" of unsynced form entries for submission to a web service.  @wq/outbox integrates with [@wq/app] to parse form submissions, [@wq/store] to handle offline storage, and with [@wq/model] for managing collections of editable objects.  @wq/outbox is based on [Redux Offline], and leverages its strategies for detecting network state and retrying failed submissions.  @wq/outbox also robustly stores photos submitted with a form until a connection is available.

### [Documentation][docs]

[**Installation**][installation]
&bull;
[**API**][api]
&bull;
[Outbox Item][outbox-item]
&bull;
[**Configuration**][configuration]
&bull;
[**Plugins**][plugin-types]
&bull;
[**Methods**][methods]

[logo]: https://wq.io/images/@wq/outbox.svg
[docs]: https://wq.io/@wq/outbox
[installation]: https://wq.io/@wq/outbox#installation
[api]: https://wq.io/@wq/outbox#api
[outbox-item]: https://wq.io/@wq/outbox#outbox-item
[configuration]: https://wq.io/@wq/outbox#configuration
[plugin-types]: https://wq.io/@wq/outbox#plugin-types
[methods]: https://wq.io/@wq/outbox#methods

[wq.app]: https://wq.io/wq.app/
[@wq/app]: https://wq.io/@wq/app
[@wq/store]: https://wq.io/@wq/store
[@wq/model]: https://wq.io/@wq/model

[Redux Offline]: https://github.com/redux-offline/redux-offline
