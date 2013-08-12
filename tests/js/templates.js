define({
    'about': "{{>header}}<p>Test</p>{{>footer}}",
    'item_detail': "{{>header}}<p>{{label}}{{>footer}}",
    'item_popup': "<a href='{{pages_info.base_url}}/items/{{id}}'>{{label}}</a>",
    'item_list': "{{>header}}\
<div class='ui-grid-a ui-responsive'>\
  <div class='ui-block-a'>\
    <ul data-role='listview' data-inset='true'>\
      {{#list}}\
      <li><a href='{{pages_info.base_url}}/items/{{id}}'>{{label}}</a></li>\
      {{/list}}\
    </ul>\
  </div>\
  <div class='ui-block-b'>\
    <div id='item-map' style='height:500px'></div>\
  </div>\
</div>\
{{>footer}}",
    'partials': {
        'header': "<div data-role='page'><div data-role='header'>{{>home}}<h1>{{label}}</h1></div><div data-role='content'>",
        'footer': "</div></div>",
        'home': "<a href='{{pages_info.base_url}}/' data-icon='home'>Home</a>"
    }
})
