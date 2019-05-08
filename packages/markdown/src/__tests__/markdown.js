import markdown from '../markdown';
import data from './data.json';

beforeAll(() => {
    markdown.init();
});

test('markdown & syntax highlighting', () => {
    var context = markdown.context(data, {}),
        div = document.createElement('div'),
        byClass = name => div.getElementsByClassName(name);
    div.innerHTML = context.html;
    expect(byClass('language-python')).toHaveLength(1);
    expect(byClass('hljs-keyword')).toHaveLength(2);
});
