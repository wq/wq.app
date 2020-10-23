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
        wq init        (if using r.js)
        wq setversion
        wq collectjson (if configured)
        wq scss        (if configured)
        wq mustache    (if configured)
        npm run build  (if using npm)
        wq optimize    (if using r.js)
        wq babel       (if configured & using r.js)
        wq appcache    (if configured & using r.js)
    """

    has_package_json = os.path.exists(
        os.path.join(os.path.dirname(config.filename), 'package.json')
    )
    if has_package_json and 'optimize' in config:
        raise click.UsageError(
            "optimize section is not used for npm build"
        )

    def run(command, **kwargs):
        confs = config.get(command.name, {})
        if not isinstance(confs, list):
            confs = [confs]
        for conf in confs:
            conf.update(kwargs)
            ctx.invoke(command, **conf)

    if 'optimize' in config:
        run(init)

    # Save version information
    run(setversion, version=version)

    for command in (collectjson, scss, mustache):
        if command.name in config:
            run(command)

    if has_package_json:
        subprocess.check_call(
            ['npm', 'run', 'build'],
            cwd=os.path.abspath(os.path.dirname(config.filename))
        )
    elif 'optimize' in config:
        # Compile Javascript / CSS (using r.js)
        ctx.invoke(optimize)

        # Convert to ES5 via babel.js
        if 'babel' in config:
            ctx.invoke(babel)

        # Generate HTML5 Cache manifests
        if 'appcache' in config:
            ctx.invoke(appcache, version=version)
