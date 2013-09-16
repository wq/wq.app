import os


def init(conf, indir):
    jsdir = conf.get('js', indir + '/js')
    cssdir = conf.get('css', indir + '/css')
    assets = os.path.dirname(os.path.dirname(__file__))
    if not os.path.exists(jsdir + '/wq'):
        os.symlink(assets + '/js', jsdir + '/wq')
    if not os.path.exists(cssdir + '/wq'):
        os.symlink(assets + '/css', cssdir + '/wq')
