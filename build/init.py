import click
from wq.core import wq
from os.path import exists, join, dirname
from os import symlink, mkdir


@wq.command()
@click.option(
    '--js', default='js', type=click.Path(),
    help='Path to JS folder (default js/)'
)
@click.option(
    '--css', default='css', type=click.Path(),
    help='Path to CSS folder (default css/)'
)
@click.option(
    '--scss', default='scss', type=click.Path(),
    help='Path to SCSS/SASS folder (default scss/)'
)
def init(**conf):
    """
    Link js, css, and scss to wq.app libs.  This makes it possible to leverage
    wq.app's assets via short relative paths without vendoring the entire
    wq.app codebase in your project.  A "lib/" folder will be configured for
    each of the three asset types.

    While symbolic links are supported on all modern operating systems, some
    (i.e. Windows) may require administrative access.  After running wq init as
    an administrator, you should be able to continue as a standard user.

    Note: It's best to configure VCS to completely ignore the lib/ entries -
    since they may be different on each computer, and they can be created
    automatically as needed.
    """

    def maybe_symlink(source, dest):
        try:
            symlink(source, dest)
        except OSError as e:
            raise click.ClickException(
                "%s.\n\nSee wq init --help for more info" % (e)
            )

    for name in ('js', 'css', 'scss'):
        basedir = conf[name]
        if not exists(basedir):
            continue

        # Project lib directory (e.g. myapp/js/lib)
        projpath = join(basedir, 'lib')
        # wq source directory (e.g. wq.app/js)
        wqpath = join(dirname(dirname(__file__)), name)

        if not exists(projpath):
            # e.g myapp/js/lib -> wq.app/js
            if name == "scss":
                # scss/lib should always be a folder
                mkdir(projpath)
            else:
                maybe_symlink(wqpath, projpath)
        if exists(join(wqpath, 'wq')) and not exists(join(projpath, 'wq')):
            # e.g myapp/js/lib/wq -> wq.app/js/wq
            maybe_symlink(join(wqpath, 'wq'), join(projpath, 'wq'))
        if name == "scss" and not exists(join(projpath, 'compass')):
            # myapp/scss/lib/compass -> compass_stylesheets/stylesheets/compass
            import pkg_resources
            compass = pkg_resources.resource_filename(
                'compass_stylesheets',
                join('stylesheets', 'compass'),
            )
            maybe_symlink(compass, join(projpath, 'compass'))
