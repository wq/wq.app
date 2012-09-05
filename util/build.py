#!/usr/bin/python

import subprocess 
import json
import os
import sys
import re
import random

from .collect    import collectjson
from .setversion import setversion
from .appcache   import appcache

class Builder(object):
    conf = None
    indir = None
    outdir = None
    version = ""

    def __init__(self, version=None, config="app.build.json"):
        # Load configuration file
        self.conf = json.load(open(config))
        if 'optimize' not in self.conf:
           raise Exception("No optimize section in conf file!")
        
        # Determine input and output directories
        self.indir  = self.conf['optimize']['appDir']
        self.outdir = self.conf['optimize']['dir']
        if version is not None:
            self.version = version
    
    def build(self):
        # Save version information
        if 'setversion' in self.conf or self.version != "":
            self.setversion()

        # Collect files into JSON(P) objects
        if 'collectjson' in self.conf:
            self.collectjson()

        # Compile Javascript / CSS (using r.js)
        self.optimize()
    
        # Collect files into JSON objects again (turn off remapping)
        if 'collectjson' in self.conf:
           self.collectjson(remap=False)

        # Generate HTML5 Cache manifests
        if 'appcache' in self.conf:
           self.appcache()

    def setversion(self, directory=None, conf=None):
        if directory is None:
            directory = self.indir
        if conf is None:
            conf = self.conf.get('setversion', {})
        if self.version != '':
            conf['version'] = self.version
        setversion(conf, directory)

    def collectjson(self, remap=True, directory=None, conf=None):
        """Collect files into JSON dictionaries"""
        if directory is None:
            directory = self.indir
        if conf is None:
            conf = self.conf.get('collectjson', {})

        if isinstance(conf, dict):
            collectjson(conf, directory, remap)
        else:
            # Assume multiple collectjson configurations
            for c in conf:
                collectjson(c, directory, remap)

    def optimize(self, conf=None):
        "Combine and optimize Javascript and CSS files"
        if conf is None:
            conf = self.conf.get('optimize', {})

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
        os.remove(self.outdir + '/' + bfile)
        print "Optimization complete"
        print '#' * 20

    def appcache(self, conf=None):
        if conf is None:
            conf = self.conf.get('appcache', {})
        appcache(conf, self.indir, self.outdir, self.version)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        args = sys.argv[1:]
    else:
        args = []
    builder = Builder(*args)
    builder.build()
