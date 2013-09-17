#!/usr/bin/python

import json

from .collect import collectjson
from .setversion import setversion
from .appcache import appcache
from .compilers import optimize, scss
from .init import init


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
        self.indir = self.conf['optimize']['appDir']
        self.outdir = self.conf['optimize']['dir']
        if version is not None:
            self.version = version

    def init(self, conf=None):
        if conf is None:
            conf = self.conf.get('init', {})
        init(conf, self.indir)

    def build(self):
        self.init()

        # Save version information
        if 'setversion' in self.conf or self.version != "":
            self.setversion()

        # Collect files into JSON(P) objects
        if 'collectjson' in self.conf:
            self.collectjson()

        if 'scss' in self.conf:
            self.scss()

        # Compile Javascript / CSS (using r.js)
        self.optimize()

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
        self.version = setversion(conf, directory)

    def collectjson(self, directory=None, conf=None):
        """Collect files into JSON dictionaries"""
        if directory is None:
            directory = self.indir
        if conf is None:
            conf = self.conf.get('collectjson', {})

        if isinstance(conf, dict):
            collectjson(conf, directory)
        else:
            # Assume multiple collectjson configurations
            for c in conf:
                collectjson(c, directory)

    def scss(self, conf=None):
        if conf is None:
            conf = self.conf.get('scss', {})
        if isinstance(conf, dict):
            scss(conf)
        else:
            for c in conf:
                scss(cs)

    def optimize(self, conf=None):
        "Combine and optimize Javascript and CSS files"
        if conf is None:
            conf = self.conf.get('optimize', {})

        optimize(conf, self.indir, self.outdir)

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
