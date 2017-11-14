from wq.core import wq
import click

import os
import json

import scss as pyScss
import logging
import pystache

from .collect import readfiles
import requirejs
from babeljs import transformer as babeljs


@wq.command()
@wq.pass_config
def optimize(config):
    """
    Use r.js to optimize JS and CSS assets.  This command requires an
    "optimize" section in your configuration file, which will be passed as-is
    to r.js for compilation.  See http://requirejs.org/docs/optimization.html
    for available configuration options.
    """
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
    Use babel.js to compile ES6/2015+.  Generates ES5-compatible JavaScript for
    older browsers.  Note that wq babel is run after wq optimize, on the
    compiled modules created by r.js.  Support for running babel at other
    stages of the build process may be added in a future version of wq.app.
    """
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
    Render all SCSS/SASS files into CSS.  The input directory will be searched
    for *.scss files, which will be compiled to corresponding *.css files in
    the output directory.
    """
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


@wq.command()
@click.option('--template', help="Path to template")
@click.option('--partials', help="Path to partials")
@click.option('--context', help="Path to context (JSON or YAML)")
@click.option(
    '--output', type=click.Path(), default="output.html",
    help="Output filename"
)
def mustache(**conf):
    """
    Render a mustache template into static HTML.  The template context can be
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
    """
    template = conf['template']
    if template is None:
        return
    if os.path.exists(template) or template.endswith('.html'):
        try:
            template = open(template).read()
        except IOError as e:
            raise click.FileError(template, hint=str(e))

    context = conf["context"] or {}
    if not isinstance(context, dict):
        if context.startswith('{'):
            context = json.loads(context)
        else:
            path = context
            context = readfiles(path, "yaml", "yml")
            context.update(**readfiles(path, "json"))

    partials = conf['partials'] or {}
    if not isinstance(partials, dict):
        partials = readfiles(partials, "html")

    click.echo("Generating %s from %s" % (conf['output'], conf['template']))
    renderer = pystache.Renderer(partials=partials)
    html = renderer.render(template, context)
    f = open(conf['output'], 'w')
    f.write(html)
    f.close()
