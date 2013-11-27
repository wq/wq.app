import os


def init(conf, indir):
    jsdir = conf.get('js', indir + '/js')
    cssdir = conf.get('css', indir + '/css')
    assets = os.path.dirname(os.path.dirname(__file__))

    if not os.path.exists(jsdir + '/lib'):
        os.symlink(assets + '/js', jsdir + '/lib')
    elif not os.path.exists(jsdir + '/lib/wq'):
        os.symlink(assets + '/js/wq', jsdir + '/lib/wq')

    if not os.path.exists(cssdir + '/lib'):
        os.symlink(assets + '/css', cssdir + '/lib')
