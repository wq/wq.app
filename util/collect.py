import os
import json

def collectjson(conf, directory, remap):
    obj = {}
    cur = os.getcwd()
    os.chdir(directory)
    for d in conf['paths']:
      for path, dirs, files in os.walk(d):
        if '.svn' in dirs:
            dirs.remove('.svn')
        o = obj
        if path == d:
            path = ""
        else:
            apath = path.split('/')[1:]
            for subdir in apath:
                o = o[subdir]
            path = '/'.join(apath) + '/'
        for filename in files:
            name, ext = os.path.splitext(filename)
            if ext == '.' + conf['type']:
                fpath = path + name
                if 'remap' in conf:
                    if remap and fpath in conf['remap'].keys():
                        fpath = conf['remap'][fpath]
                    elif fpath in conf['remap'].values():
                        fpath = None

                if fpath is not None:
                    data = open(d + '/' + fpath + '.' + conf['type'])
                    if conf['type'] == "json":
                        try:
                            o[name] = json.load(data)
                        except ValueError:
                            print "Could not parse %s!" % name
                            raise
                    else:
                        o[name] = data.read()

        for name in dirs:
            o[name] = {}

    outfile = open(conf['output'], 'w')
    opts = dict([
        (str(key), value)
        for key, value in conf.get('json', {'indent': 4}).items()
    ])
    
    if 'jsonp' in conf:
        txt = json.dumps(obj, **opts)
        txt = '%s(%s);' % (conf['jsonp'], txt)
        outfile.write(txt)
    else:
        json.dump(obj, outfile, **opts)

    print '%s: %s objects collected from %s' % (conf['output'], len(obj), ', '.join(conf['paths']))

    outfile.close()
    os.chdir(cur)
