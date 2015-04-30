from wq.core import wq
import click

from .collect import collectjson
from .setversion import setversion
from .appcache import appcache
from .compilers import optimize, scss, mustache
from .init import init

COMMANDS = {
    'collectjson': collectjson,
    'init': init,
    'mustache': mustache,
    'scss': scss,
    'setversion': setversion,
}


@wq.command()
@click.argument('version')
@wq.pass_config
@click.pass_context
def build(ctx, config, version):
    if 'optimize' not in config:
        click.echo("optimize section not found in %s" % config.filename)
        return

    def run(name, **kwargs):
        confs = config.get(name, {})
        command = COMMANDS[name]
        if not isinstance(confs, list):
            confs = [confs]
        for conf in confs:
            conf.update(kwargs)
            ctx.invoke(command, **conf)

    run('init')

    # Save version information
    run('setversion', version=version)

    for name in ('collectjson', 'scss', 'mustache'):
        if name in config:
            run(name)

    # Compile Javascript / CSS (using r.js)
    ctx.invoke(optimize)

    # Generate HTML5 Cache manifests
    if 'appcache' in config:
        ctx.invoke(appcache, version=version)
