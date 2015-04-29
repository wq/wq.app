from __future__ import print_function

import os
import json
from wq.core import wq
import click

try:
    import yaml
except:
    yaml = None

NEST = {
    'json': json,
    'yaml': yaml
}


def readfiles(basedir, ftype=None, fext=None):
    obj = {}
    if fext is None:
        fext = ftype

    for path, dirs, files in os.walk(basedir):
        if '.svn' in dirs:
            dirs.remove('.svn')
        o = obj
        if path == basedir:
            path = ""
        else:
            path = path[len(basedir) + 1:]
            apath = path.split(os.sep)
            for subdir in apath:
                o = o[subdir]
            path = os.sep.join(apath) + os.sep

        for filename in files:
            name, ext = os.path.splitext(filename)
            if ftype and ext != '.' + fext:
                continue

            fpath = path + name
            data = open(basedir + os.sep + fpath + ext)
            if NEST.get(ftype, None):
                try:
                    o[name] = NEST[ftype].load(data)
                except ValueError:
                    print("Could not parse %s!" % name)
                    raise
            else:
                o[name] = data.read()

        for name in dirs:
            o[name] = {}

    return obj


@wq.command()
@click.option('--type', help="Source file type (e.g. json, yaml)")
@click.option('--extension', help="Source file extension (e.g. json, yml)")
@click.option('--output', help="Destination JSON file")
@click.argument('paths', nargs=-1)
@click.pass_obj
def collectjson(config, **kwargs):
    "Collect files and dump the result into a JSON object"
    conf = {
        'type': 'json',
        'extension': None,
        'output': 'output.json',
        'paths': ['.'],
        'json': {'indent': 4},
    }
    conf.update(config.get('collectjson', {}))
    for key, val in kwargs.items():
        if val:
            conf[key] = val

    if not conf['extension']:
        conf['extension'] = conf['type']

    obj = {}
    for d in conf['paths']:
        obj.update(readfiles(d, conf['type'], conf['extension']))

    outfile = open(conf['output'], 'w')

    opts = dict([
        (str(key), value)
        for key, value in conf['json'].items()
    ])

    if 'jsonp' in conf:
        txt = json.dumps(obj, **opts)
        txt = '%s(%s);' % (conf['jsonp'], txt)
        outfile.write(txt)
    else:
        json.dump(obj, outfile, **opts)

    print('%s: %s objects collected from %s' % (
        conf['output'], len(obj), ', '.join(conf['paths'])
    ))

    outfile.close()
