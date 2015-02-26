import json
import yaml
import sys

from .collect import collectjson
from .setversion import setversion
from .appcache import appcache
from .compilers import optimize, scss, mustache
from .init import init


class Builder(object):
    conf = None
    indir = None
    outdir = None
    version = ""

    COMMANDS = {
        'init': init,
        'collectjson': collectjson,
        'scss': scss,
        'mustache': mustache,
    }

    def __init__(self, version=None, config="wq.yml"):
        # Load configuration file
        try:
            self.conf = yaml.load(open(config))
        except (OSError, IOError):
            try:
                self.conf = json.load(open("app.build.json"))
            except (OSError, IOError):
                raise Exception("Could not find configuration file.")
            else:
                sys.stderr.write(
                    "Warning: Converted app.build.json to wq.yml\n"
                )
                yaml.dump(self.conf, open("wq.yml", 'w'))

        if 'optimize' not in self.conf:
            raise Exception("No optimize section in conf file!")

        # Determine input and output directories
        self.indir = self.conf['optimize']['appDir']
        self.outdir = self.conf['optimize']['dir']
        if version is not None:
            self.version = version

    def build(self):
        self.run('init')

        # Save version information
        if 'setversion' in self.conf or self.version != "":
            self.setversion()

        for command in ('init', 'collectjson', 'scss', 'mustache'):
            if command in self.conf:
                self.run(command)

        # Compile Javascript / CSS (using r.js)
        self.optimize()

        # Generate HTML5 Cache manifests
        if 'appcache' in self.conf:
            self.appcache()

    def run(self, command, directory=None, conf=None):
        if directory is None:
            directory = self.indir
        if conf is None:
            conf = self.conf.get(command, {})

        fn = self.COMMANDS[command]
        if isinstance(conf, dict):
            fn(conf, directory)
        else:
            for c in conf:
                fn(c, directory)

    def setversion(self, directory=None, conf=None):
        if directory is None:
            directory = self.indir
        if conf is None:
            conf = self.conf.get('setversion', {})
        if self.version != '':
            conf['version'] = self.version
        self.version = setversion(conf, directory)

    def optimize(self, conf=None):
        "Combine and optimize Javascript and CSS files"
        if conf is None:
            conf = self.conf.get('optimize', {})

        optimize(conf, self.indir, self.outdir)

    def appcache(self, conf=None):
        if conf is None:
            conf = self.conf.get('appcache', {})
        appcache(conf, self.indir, self.outdir, self.version)
