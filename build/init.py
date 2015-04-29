import click
from wq.core import wq
from os.path import exists, join, dirname
from os import symlink, mkdir


@wq.command()
@click.option(
    '--js', default='js', type=click.Path(), help='Path to JS folder'
)
@click.option(
    '--css', default='css', type=click.Path(), help='Path to CSS folder'
)
@click.option(
    '--scss', default='scss', type=click.Path(),
    help='Path to SCSS/SASS folder'
)
def init(**conf):
    """
    Link js, css, and scss to wq.app libs
    """
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
                symlink(wqpath, projpath)
        if exists(join(wqpath, 'wq')) and not exists(join(projpath, 'wq')):
            # e.g myapp/js/lib/wq -> wq.app/js/wq
            symlink(join(wqpath, 'wq'), join(projpath, 'wq'))
        if name == "scss" and not exists(join(projpath, 'compass')):
            # myapp/scss/lib/compass -> compass_stylesheets/stylesheets/compass
            import pkg_resources
            compass = pkg_resources.resource_filename(
                'compass_stylesheets',
                join('stylesheets', 'compass'),
            )
            symlink(compass, join(projpath, 'compass'))
