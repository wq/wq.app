from __future__ import print_function

import os


def setversion(conf, indir):
    filename = conf.get('filename', indir + '/version.txt')
    if (conf.get('version', None) is None):
        if os.path.exists(filename):
            version = open(filename).read().strip()
        else:
            version = ""
    else:
        version = conf['version']
        vtxt = open(filename, 'w')
        vtxt.write(version)
        vtxt.close()

    if 'jsout' in conf:
        # Update version.js
        vjs = open(indir + '/' + conf['jsout'], 'w')
        vjs.write(VERSIONJS_TMPL % version)
        vjs.close()
        print('%s: %s' % (conf['jsout'], version))
    else:
        print('Application version: %s' % version)

    return version

VERSIONJS_TMPL = """define(function(){return "%s";});"""
