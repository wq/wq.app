@wq/react
========

[@wq/react]

**@wq/react** is a renderer plugin for [@wq/app] that seamlessly integrates with the [React] and [React Native] frameworks.  @wq/react provides a number of default [components](#components) and [hooks](#hooks) to facilitate rapid deployment of applications backed by @wq/app's storage, data model, routing, and syncing engines ([@wq/store], [@wq/model], [@wq/router], and [@wq/outbox], respectively.)

@wq/react is meant to be used with [@wq/material], which provides a collection of ready-to-use Material Design interface components.

## Installation

### wq.app for PyPI

```bash
python3 -m venv venv      # create virtual env (if needed)
. venv/bin/activate       # activate virtual env
python3 -m pip install wq # install wq framework (wq.app, wq.db, etc.)
# pip install wq.app      # install wq.app only
```

### @wq/react for npm

```bash
npm install @wq/material # install @wq/material and @wq/react and deps
# npm install @wq/react  # install only @wq/react and deps
```

## API

@wq/react should be registered with @wq/app as a plugin, either directly or indirectly via [@wq/material].

```javascript
import app from '@wq/app';
import material from '@wq/material';

app.use(material);  // Automatically registers @wq/react

app.init(...);
```

## Components

@wq/react provides a complete set of components corresponding to @wq/app's [data model][config] and [URL structure][url-structure].  The components are grouped into four categories:

plugin key | description
--|--
[components](#general-components) | General components (List, Table, Button, etc.)
[icons](#icon-components) | Icon components
[input](#input-components) | Form inputs
[views](#view-components) | View components

To override components in any of these categories, register a custom plugin with the corresponding key.  The value should be an object mapping component names to components.  (Indeed, [this is how][material-index] @wq/material overrides @wq/react's minimalist defaults with more complete versions.)  A plugin name is not required, so it can be convenient to create an `[category]/index.js` that exports all componenents, then register it via an anonymous object:

```javascript
// src/index.js
import app from '@wq/app';
import material from '@wq/material';
import components from './components';
import inputs from './inputs';

app.use(material)
app.use({ components, inputs });
app.init(...);

// src/components/index.js
import Header from './CustomHeader';
import Footer from './CustomFooter';
export default {
    Header,
    Footer
}

// src/inputs/index.js
import Select from './CustomDefaultSelect';
export default {
    Select,
}
```

### General Components

@wq/material overrides most of the default general components, and only those that are not overridden are listed here.  See [@wq/material's general components][material-components] for the remainder.  The components below should not generally be overridden except in advanced cases.  

Name | Details
--|--
[AutoForm] | Reads the [form configuration][field-types] corresponding to the current route and renders a <Form> with the appropriate inputs and controls
[AutoInput] | Selects the appropriate input component for the given [form field][field-types]
[AutoSubform] | Automatically configures a [Fieldset] for a [nested form][nested-forms]
[AutoSubformArray] | Automatically configures a [FieldsetArray] for a [repeating nested form][nested-forms]
[DebugContext] | Shows the JSON contents of the current route rendering context
[Form] | Connects [Formik] to [@wq/outbox]'s form handler


## Icon Components

@wq/material overrides all default icon components ([see list][material-icons]), but they are listed here for convenience.

name | description
--|--
[Add] | Used for "Add New Record" [Fab]
[Edit] | Used for "Edit This Record" [Fab]
[Delete] |
[Success] | Shown in outbox for synced records
[Error] | Shown in outbox for failed sync attempts
[Pending] | Shown in outbox for currently syncing records

While the defaults can be overridden, the more common use of a custom `{ icons }` plugin is to to specify the rest of a "vocabulary" of icons to use throughout the application.  Icon components are registered as PascalCase, but should be referenced via param-case in general components like [`<IconButton/>`][IconButton] and [`<Fab/>`][Fab].

```javascript
<IconButton icon="delete" />
<Fab icon="edit" />
```

## Input Components

Input components are used when rendering [form fields][field-types].   @wq/material overrides all default input components ([see list][material-inputs]), but they are listed here for convenience.

Name | HTML Equivalent | XLSForm Types
--|--|--
[Checkbox] | `<input type=checkbox>` | n/a
[DateTime] | `<input type={date,time,datetime-local}>` | date, time, dateTime
[Input] | `<input type={text,number,file,...}>` | string, int, decimal, binary, ...
[Radio] | `<input type=radio>` | select one
[Select] | `<select>` | select one / select
[Toggle] | n/a | select one

Note that overriding any of the above will affect how all corresponding inputs are rendered.  If you only want to override the input for a specific form field, set the [XLSForm "appearance" attribute][xlsform-appearance] on that field and then define a corresponding component name.  Note that the component should be registered via PascalCase, while the appearance definition should use param-case.

For example, given an XLSForm configuration like this:

type|name|label|appearance
--|--|--|--
string|name|Your Name|
select one colors|favorite_color|Your Favorite Color|color-select
select one foods|favorite_food|Your Favorite Food|

And an inputs/index.js like this:

```javascript
import Select from './CustomDefaultSelect';
import ColorSelect from './ColorSelect';

export default {
    Select,
    ColorSelect
}
```

The "name" field would be rendered with `<Input/>`, "favorite_color" be rendered with `<ColorSelect/>`, and the "favorite_foods" input would use `<CustomDefaultSelect/>`.

## View Components

Unlike the other component types, the set of default view components is defined only in @wq/react and is not overridden by @wq/material.  This is because all view components are defined exclusively in terms of the other registered component types.

The view component used to render a route is selected by the high level [`<App/>`][App] component by attempting a number of matches with increasing generality.  The configured [route name and mode][@wq/router] are most essential for matching. 

name | description
--|--
[Default] | Fallback view for all routes that do not have a registered custom view, or a mode of "detail", "edit", or "list".
[DefaultDetail] | Default view for all "*_detail" routes.  Shows the properties of the selected item in a table generated from the form definition.
[DefaultEdit] | Default view for all "*_edit" routes.  Shows an <AutoForm> for creating or editing the selected item.
[DefaultList] | Default view for all "*_list" routes.
[Index] | Main index view for the app
[Loading] | View to show during the brief interval between navigation and the [@wq/router] RENDER action.
[Login] | Login form.  When submitted, the default auth plugin in [@wq/app] will submit the credentials to the server if available.
[Logout] | Logout form.  The default auth plugin will automatically clear local credentials when this view is loaded.
[NotFound] | 404 view for when the route is not found at all.
[OutboxList] | Lists items in the outbox.  (There is no OutboxDetail/OutboxEdit, as the model-specific views are used instead).
[Server] | View for rendering content loaded from the server (WIP)

To override a view for a specific route, register a corresponding component with the name converted to PascalCase.  E.g. "about" -> "About" or "observation_edit" -> "ObservationEdit".  Otherwise, override one of the Default* components above to make the change effective for all corresponding routes.

[@wq/react]: https://github.com/wq/wq.app/tree/master/packages/react
[@wq/app]: https://wq.io/docs/app-js
[@wq/store]: https://wq.io/docs/store-js
[@wq/model]: https://wq.io/docs/model-js
[@wq/router]: https://wq.io/docs/router-js
[@wq/outbox]: https://wq.io/docs/outbox-js
[@wq/material]: https://github.com/wq/wq.app/tree/master/packages/material

[config]: https://wq.io/docs/config
[url-structure]: https://wq.io/docs/url-structure
[material-index]: https://github.com/wq/wq.app/blob/master/packages/material/src/index.js
[material-components]: https://github.com/wq/wq.app/tree/master/packages/material#general-components
[material-icons]: https://github.com/wq/wq.app/tree/master/packages/material#icon-components
[material-inputs]: https://github.com/wq/wq.app/tree/master/packages/material#input-components
[field-types]: https://wq.io/docs/field-types
[nested-forms]: https://wq.io/docs/nested-forms

[React]: https://reactjs.org
[React Native]: https://reactnative.dev/
[Formik]: https://formik.org
[xlsform-appearance]: https://xlsform.org/en/#appearance

[App]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/App.js
[AutoForm]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/AutoForm.js
[AutoInput]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/AutoInput.js
[AutoSubform]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/AutoSubform.js
[AutoSubformArray]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/AutoSubformArray.js
[DebugContext]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/DebugContext.js
[Form]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/Form.js
[Fab]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/Fab.js
[IconButton]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/IconButton.js
[Fieldset]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/Fieldset.js
[FieldsetArray]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/FieldsetArray.js

[Add]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/icons/Add.js
[Edit]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/icons/Edit.js
[Delete]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/icons/Delete.js
[Success]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/icons/Success.js
[Error]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/icons/Error.js
[Pending]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/icons/Pending.js

[Checkbox]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/inputs/Checkbox.js
[DateTime]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/inputs/DateTime.js
[Input]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/inputs/Input.js
[Radio]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/inputs/Radio.js
[Select]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/inputs/Select.js
[Toggle]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/inputs/Toggle.js

[Default]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/views/Default.js
[DefaultDetail]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/views/DefaultDetail.js
[DefaultEdit]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/views/DefaultEdit.js
[DefaultList]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/views/DefaultList.js
[Index]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/views/Index.js
[Loading]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/views/Loading.js
[Login]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/views/Login.js
[Logout]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/views/Logout.js
[NotFound]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/views/NotFound.js
[OutboxList]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/views/OutboxList.js
[Server]: https://github.com/wq/wq.app/blob/master/packages/react/src/components/views/Server.js
