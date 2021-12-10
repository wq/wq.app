from wq.build import wq
import click

import os
import json
import logging
from wq.build.commands.collect import readfiles


@wq.command()
@wq.pass_config
def optimize(config):
    """
    (DEPRECATED) Use r.js to optimize JS and CSS. This command requires an
    "optimize" section in your configuration file, which will be passed to
    r.js for compilation.  See http://requirejs.org/docs/optimization.html
    for available options.

    Note that r.js-based compilation is deprecated and will be removed in
    wq.app 2.0. For full control over the compilation process, use
    `wq start --with-npm` instead.
    """
    try:
        import requirejs
    except ImportError:
        raise NotInstalled('requirejs')

    conf = config.get('optimize', None)
    if not conf:
        raise click.UsageError(
            "optimize section not found in %s" % config.filename
        )

    # Defer to r.js for actual processing
    click.echo("Optimizing with r.js...")
    try:
        requirejs.optimize(conf)
    except requirejs.RJSException as e:
        raise click.ClickException(e.args[0])

    click.echo("Optimization complete")


@wq.command()
@wq.pass_config
def babel(config):
    """
    (DEPRECATED) Use babel.js with ES6/2015+.  Generates ES5-compatible
    JavaScript for older browsers.  Note that wq babel is run after
    wq optimize, on the compiled modules created by r.js.  For more control
    over the compilation process, use `wq start --with-npm` instead of
    an r.js-based build.

    Note that this command will be removed in wq.app 2.0 in favor of
    `wq start --with-npm`.
    """
    try:
        from babeljs import transformer as babeljs
    except ImportError:
        raise NotInstalled('PyBabeljs')

    rconf = config.get('optimize', None)
    if not rconf:
        raise click.UsageError(
            "optimize section not found in %s" % config.filename
        )

    babel = config.get('babel', {})
    files = []
    if 'modules' in rconf and 'dir' in rconf:
        base_url = rconf.get('baseUrl', '.')
        for module in rconf['modules']:
            path = module['name']
            if path in rconf.get('paths', {}):
                path = rconf['paths'][path]
            path = os.path.join(rconf['dir'], base_url, path)
            files.append(path + '.js')

    for filename in files:
        label = os.path.normpath(filename)
        try:
            with open(filename) as f:
                content = f.read()
        except OSError:
            raise click.ClickException(
                "Error loading %s - run wq optimize first?" % label
            )
        try:
            print("Transforming %s with Babel..." % label)
            output = babeljs.transform_string(content, **babel)
        except babeljs.TransformError as e:
            raise click.ClickException(e.args[0])
        with open(filename, 'w') as f:
            f.write(output)


@wq.command()
@click.option(
    '--indir', type=click.Path(exists=True), default="scss",
    help="Path to SCSS/SASS files"
)
@click.option(
    '--outdir', type=click.Path(exists=True), default="css",
    help="Path to CSS files"
)
def scss(**conf):
    """
    (DEPRECATED) Render SCSS/SASS into CSS.  The input folder will be searched
    for *.scss files, which will be compiled to corresponding *.css files in
    the output directory.

    Note: This command will be removed in wq.app 2.0 in favor of
    Material UI themes.
    """
    try:
        import scss as pyScss
    except ImportError:
        raise NotInstalled("pyScss")

    compiler = pyScss.Scss(scss_opts={'compress': 0})
    logging.getLogger("scss").addHandler(logging.StreamHandler())

    def compile(path, source):
        css = compiler.compile(source)
        outfile = open(path, 'w')
        outfile.write(css)
        outfile.close()

    files = readfiles(conf['indir'], "scss")
    pyScss.config.LOAD_PATHS = [
        conf['indir'],
        os.path.join(conf['indir'], 'lib'),

        # FIXME: Why aren't these paths automatically picked up on Windows?
        os.path.join(conf['indir'], 'lib', 'compass'),
        os.path.join(conf['indir'], 'lib', 'compass', 'css3'),
    ]
    for name, source in files.items():
        if isinstance(source, dict):
            continue
        path = "%s/%s.css" % (conf['outdir'], name)
        compile(path, source)
        click.echo("%s compiled from %s/%s.scss" % (path, conf['indir'], name))


class path_or_dict:
    def __init__(self, value):
        self.value = value
        if isinstance(value, dict):
            self.is_dict = True
        else:
            self.is_dict = False
            assert isinstance(value, str)


@wq.command()
@click.option('--template', help="Path to template")
@click.option('--partials', help="Path to partials",
              type=path_or_dict)
@click.option('--context', help="Path to context (JSON or YAML)",
              type=path_or_dict)
@click.option(
    '--output', type=click.Path(), default="output.html",
    help="Output filename"
)
def mustache(**conf):
    """
    (DEPRECATED) Render mustache into HTML files.  The template context can be
    provided via a nexted object in wq.yml, or by pointing to a folder
    containing JSON or YAML files.  Similarly, the partials can be defined as a
    nested object in wq.yml or by a folder path.

    Example YAML configuration:

    \b
    mustache:
        template: "<html><body>{{>header}}{{>footer}}</body></html>"
        partials:
            header: "<h3>{{title}}</h3>"
            footer: "<a href='mailto:{{email}}'>{{email}}</a>"
        context:
            title: "Example"
            email: "email@example.com"
        output: index.html

    Example command line configuration:

    wq mustache --template tmpl.html --partials partials/ --context conf/

    Note: This command will be removed in wq.app 2.0 in favor of JSX.
    """
    try:
        import pystache
    except ImportError:
        raise NotInstalled('pystache')

    template = conf['template']
    if template is None:
        return
    if os.path.exists(template) or template.endswith('.html'):
        try:
            template = open(template).read()
        except IOError as e:
            raise click.FileError(template, hint=str(e))

    context_arg = conf["context"] or path_or_dict({})
    if context_arg.is_dict:
        context = context_arg.value
    else:
        if context_arg.value.startswith('{'):
            context = json.loads(context_arg.value)
        else:
            path = context_arg.value
            context = readfiles(path, "yaml", "yml")
            context.update(**readfiles(path, "json"))

    partials_arg = conf['partials'] or path_or_dict({})
    if partials_arg.is_dict:
        partials = partials_arg.value
    else:
        partials = readfiles(partials_arg.value, "html")

    click.echo("Generating %s from %s" % (conf['output'], conf['template']))
    renderer = pystache.Renderer(partials=partials)
    html = renderer.render(template, context)
    f = open(conf['output'], 'w')
    f.write(html)
    f.close()


class NotInstalled(click.ClickException):
    def __init__(self, dep):
        super().__init__(
            "Could not find {}. Install compat dependencies via:"
            "\n    pip install wq.app[compat]".format(dep)
        )
