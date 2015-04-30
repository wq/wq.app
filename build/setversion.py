import os
from wq.core import wq
import click


@wq.command()
@click.option(
    '--filename', '-f', default='version.txt',
    help="Name of text file (default is version.txt)"
)
@click.option('--jsout', help="Name of an AMD module (e.g. myapp/version.js)")
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

    if conf['jsout']:
        # Update version.js
        vjs = open(conf['jsout'], 'w')
        vjs.write(VERSIONJS_TMPL % version)
        vjs.close()
        click.echo('%s: %s' % (conf['jsout'], version))
    else:
        click.echo('Application version: %s' % version)

    return version

VERSIONJS_TMPL = """define(function(){return "%s";});"""
