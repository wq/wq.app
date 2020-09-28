import os
from wq.core import wq
import click
import re


@wq.command()
@click.option(
    '--filename', '-f', default='version.txt',
    help="Name of text file (default is version.txt)"
)
@click.option('--jsout', help="Name of an AMD module (e.g. myapp/version.js)")
@click.option('--esm', help="Name of an ESM module (e.g. myapp/version.js)")
@click.option('--package', help="Path to package.json")
@click.argument('version')
def setversion(**conf):
    """
    Update version.txt (and version.js).  Useful for keeping track of which
    version has been deployed.  The version.js AMD module can be referenced
    within your application to notify users.
    """
    if conf['version'] is None:
        if os.path.exists(conf['filename']):
            version = open(conf['filename']).read().strip()
        else:
            version = ""
    else:
        version = conf['version']
        vtxt = open(conf['filename'], 'w')
        vtxt.write(version)
        vtxt.close()

    if conf['esm'] or conf['jsout']:
        # Update version.js
        if conf['esm']:
            js_file = conf['esm']
            js_tmpl = """export default "%s";"""
        else:
            js_file = conf['jsout']
            js_tmpl = """define(function(){return "%s";});"""
        with open(js_file, 'w') as f:
            f.write(js_tmpl % version)
        click.echo('%s: %s' % (js_file, version))
    else:
        click.echo('Application version: %s' % version)

    if conf['package']:
        with open(conf['package']) as f:
            content = f.read()
        content = re.sub(
            '"version": "[^"]+"',
            '"version": "%s"' % version,
            content
        )
        with open(conf['package'], 'w') as f:
            f.write(content)

    return version
