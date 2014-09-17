from os.path import exists, join, dirname
from os import symlink


def init(conf, indir):
    for name in ('js', 'css', 'scss'):
        basedir = join(indir, conf.get(name, name))
        if not exists(basedir):
            continue

        # Project lib directory (e.g. myapp/js/lib)
        projpath = join(basedir, 'lib')
        # wq source directory (e.g. wq.app/js)
        wqpath = join(dirname(dirname(__file__)), name)

        if not exists(projpath):
            # e.g myapp/js/lib -> wq.app/js
            symlink(wqpath, projpath)
        elif exists(join(wqpath, 'wq')) and not exists(join(projpath, 'wq')):
            # e.g myapp/js/lib/wq -> wq.app/js/wq
            symlink(join(wqpath, 'wq'), join(projpath, 'wq'))
