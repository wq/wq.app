from wq.core import wq
import click

from .collect import collectjson
from .setversion import setversion
from .appcache import appcache
from .compilers import optimize, scss, mustache
from .init import init


@wq.command()
@wq.pass_config
@click.pass_context
@click.argument('version')
def build(ctx, config, version):
    """
    Compile and optimize an application.

    \b
    Runs the following in order:
        wq init
        wq setversion
        wq collectjson (if configured)
        wq scss        (if configured)
        wq mustache    (if configured)
        wq optimize
        wq appcache    (if configured)
    """
    if 'optimize' not in config:
        raise click.UsageError(
            "optimize section not found in %s" % config.filename
        )

    def run(command, **kwargs):
        confs = config.get(command.name, {})
        if not isinstance(confs, list):
            confs = [confs]
        for conf in confs:
            conf.update(kwargs)
            ctx.invoke(command, **conf)

    run(init)

    # Save version information
    run(setversion, version=version)

    for command in (collectjson, scss, mustache):
        if command.name in config:
            run(command)

    # Compile Javascript / CSS (using r.js)
    ctx.invoke(optimize)

    # Generate HTML5 Cache manifests
    if 'appcache' in config:
        ctx.invoke(appcache, version=version)
