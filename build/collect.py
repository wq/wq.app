import os
import json
import yaml
from wq.core import wq
import click

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
            if ftype in NEST:
                try:
                    o[name] = NEST[ftype].load(data)
                except ValueError:
                    click.echo("Could not parse %s!" % name)
                    raise
            else:
                o[name] = data.read()

        for name in dirs:
            o[name] = {}

    return obj


@wq.command()
@click.option(
    '--type', default='json', help="Source file type (e.g. json, yaml)"
)
@click.option('--extension', help="Source file extension (e.g. json, yml)")
@click.option('--output', default='output.json', help="Destination JSON file")
@click.option('--indent', default=4, help="JSON Indentation")
@click.option('--jsonp', help="Wrap as JSONP")
@click.argument('paths', type=click.Path(exists=True), nargs=-1)
def collectjson(**conf):
    "Collect directory contents into a JSON object"

    if not conf['extension']:
        conf['extension'] = conf['type']
    if not conf['paths']:
        conf['paths'] = ['.']

    obj = {}
    for d in conf['paths']:
        obj.update(readfiles(d, conf['type'], conf['extension']))

    outfile = open(conf['output'], 'w')

    opts = {}
    if conf['indent']:
        opts['indent'] = conf['indent']

    if conf['jsonp']:
        txt = json.dumps(obj, **opts)
        txt = '%s(%s);' % (conf['jsonp'], txt)
        outfile.write(txt)
    else:
        json.dump(obj, outfile, **opts)

    click.echo('%s: %s objects collected from %s' % (
        conf['output'], len(obj), ', '.join(conf['paths'])
    ))

    outfile.close()
