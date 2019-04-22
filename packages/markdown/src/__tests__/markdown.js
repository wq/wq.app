    // Markdown+syntax plugin
    var $code = $page.find('code'),
        $keywords = $code.find('span.hljs-keyword');
    assert.equal($code.length, 1, "markdown code block");
    assert.equal($keywords.length, 2, "highlighted keywords");
