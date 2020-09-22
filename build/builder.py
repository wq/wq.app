from wq.core import wq
import click
import subprocess
import os

from .collect import collectjson
from .setversion import setversion
from .appcache import appcache
from .compilers import optimize, babel, scss, mustache
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
        wq init        (if using wq optimize)
        wq setversion
        wq collectjson (if configured)
        wq scss        (if configured)
        wq mustache    (if configured)

    \b
    Followed by either:
        wq optimize + wq babel + wq appcache
    Or:
        npm build
    """

    has_package_json = os.path.exists(
        os.path.join(os.path.dirname(config.filename), 'package.json')
    )
    if has_package_json:
        if 'optimize' in config:
            raise click.UsageError(
                "optimize section is not used for npm build"
            )
    else:
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

    if not has_package_json:
        run(init)

    # Save version information
    run(setversion, version=version)

    for command in (collectjson, scss, mustache):
        if command.name in config:
            run(command)

    if has_package_json:
        subprocess.check_call(
            ['npm', 'build'],
            cwd=os.path.abspath(os.path.dirname(config.filename))
        )
    else:
        # Compile Javascript / CSS (using r.js)
        ctx.invoke(optimize)

        # Convert to ES5 via babel.js
        if 'babel' in config:
            ctx.invoke(babel)

        # Generate HTML5 Cache manifests
        if 'appcache' in config:
            ctx.invoke(appcache, version=version)
