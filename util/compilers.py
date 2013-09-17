import os
import subprocess
import random
import json

from .collect import readfiles


def optimize(conf, indir, outdir):
    bfile = "rjsconf%s" % (random.random() * 10000)
    bjs = open(bfile, 'w')
    json.dump(conf, bjs)
    bjs.close()

    # Defer to r.js for actual processing
    print '#' * 20
    print "Optimizing with r.js"
    rjs = os.path.dirname(__file__) + "/r.js"
    subprocess.call(["node", rjs, "-o", bfile])
    os.remove(bfile)
    os.remove(outdir + '/' + bfile)
    print "Optimization complete"
    print '#' * 20


def scss(conf):
    import scss
    import logging
    compiler = scss.Scss(scss_opts={'compress': 0})
    logging.getLogger("scss").addHandler(logging.StreamHandler())

    def compile(path, source):
        css = compiler.compile(source)
        outfile = open(path, 'w')
        outfile.write(css)
        outfile.close()

    if 'indir' in conf and 'outdir' in conf:
        files = readfiles(conf['indir'], "scss")
        scss.config.LOAD_PATHS = conf['indir']
        for name, source in files.iteritems():
            if isinstance(source, dict):
                continue
            path = "%s/%s.css" % (conf['outdir'], name)
            compile(path, source)
            print "%s compiled from %s/%s.scss" % (path, conf['indir'], name)
