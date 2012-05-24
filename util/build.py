#!/usr/bin/python

from subprocess import call
import json
import os
import sys
import re
import random

def build(version=None, config="app.build.json"):
    # Load configuration file
    conf = json.load(open(config))
    if 'optimize' not in conf:
       raise Exception("No optimize section in conf file!")
    
    # Determine input and output directories
    indir  = conf['optimize']['appDir']
    outdir = conf['optimize']['dir']

    # Save version information
    if 'setversion' in conf or version is not None:
       vconf = conf.get('setversion', {})
       if version is not None:
          vconf['version'] = version
       version = setversion(vconf, indir)
    else:
       version = ""

    # Collect files into JSON(P) objects
    if 'collectjson' in conf:
       collectjson(conf['collectjson'], indir)

    # Compile Javascript / CSS (using r.js)
    optimize(conf['optimize'])
    
    # Collect files into JSON objects again (turn off remapping)
    if 'collectjson' in conf:
       collectjson(conf['collectjson'], indir, True)

    # Generate HTML5 Cache manifests
    if 'appcache' in conf:
       conf['appcache']['version'] = version
       appcache(conf['appcache'], indir, outdir)

def setversion(conf, indir):
    filename = indir + '/version.txt'
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
 
    return version

def collectjson(conf, indir, noremap=False):
    # Collect files into JSON dictionaries
    if isinstance(conf, dict):
        _collectjson(conf, indir, noremap)
    else:
        # Assume multiple collectjson configurations
        for c in conf:
            _collectjson(c, indir, noremap)

def _collectjson(conf, indir, noremap):
    obj = {}
    cur = os.getcwd()
    os.chdir(indir)
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
                    if not noremap and fpath in conf['remap'].keys():
                        fpath = conf['remap'][fpath]
                    elif fpath in conf['remap'].values():
                        fpath = None

                if fpath is not None:
                    data = open(d + '/' + fpath + '.' + conf['type'])
                    if conf['type'] == "json":
                        o[name] = json.load(data)
                    else:
                        o[name] = data.read()

        for name in dirs:
            o[name] = {}

    outfile = open(conf['output'], 'w')
    if 'jsonp' in conf:
        txt = json.dumps(obj, **(conf.get('json', {})))
        txt = '%s(%s)' % (conf['jsonp'], txt)
        outfile.write(txt)
    else:
        json.dump(obj, outfile, **(conf.get('json', {})))

    outfile.close()
    os.chdir(cur)

def optimize(conf):
     # Build Javascript and CSS files
     bfile = "rjsconf%s" % (random.random() * 10000)
     bjs = open(bfile, 'w')
     json.dump(conf, bjs)
     bjs.close()

     # Defer to r.js for actual processing
     call(["r.js", "-o", bfile])
     os.remove(bfile)

def appcache(conf, indir, outdir):

    # Open output files
    s_ac  = open(indir  + '/' + conf['name'], 'w')
    b_ac  = open(outdir + '/' + conf['name'], 'w')

    # Start in source directory - read @imports from main CSS file
    s_css = [conf['css']]
    s_css.extend(_parse_css_urls(indir, conf['css']))

    # Built CSS file contains image URLs from the @import-ed CSS files above
    images = _parse_css_urls(outdir, conf['css'])
 
    # build.txt contains a list of built javascript files and their sources
    s_js, b_js = _parse_js_buildfile(outdir + '/build.txt')
    
    b_css = [conf['css']]

    # Collect path names and create appcaches
    cache        = list(conf['cache'])
    source_cache = cache + s_js + s_css + images
    built_cache  = cache + b_js + b_css + images

    network      = list(conf['network'])
    fallback     = list(conf['fallback'])

    s_ac.write(APPCACHE_TMPL % {
        'version': conf['version'] + '_dev',
        'cache':    '\n'.join(source_cache),
        'network':  '\n'.join(network),
        'fallback': '\n'.join(fallback)
    })
    b_ac.write(APPCACHE_TMPL % {
        'version':  conf['version'],
        'cache':    '\n'.join(built_cache),
        'network':  '\n'.join(network),
        'fallback': '\n'.join(fallback)
    })
    s_ac.close()
    b_ac.close()

def _parse_js_buildfile(filename):
    text = open(filename).read()
    sources = []
    built   = []
    for group in text[1:].split('\n\n'):
        files = group.split('\n')
        
        sources.extend(files[2:])
        built.append(files[0])

    return sources, built

def _parse_css_urls(path, filename):
    cur = os.getcwd()
    os.chdir(path)
    text = open(filename).read()
    base = os.path.dirname(filename)
    urls = []
    for line in text.split('\n'):
        m = re.search(r"url\(['\" ]*(.+?)['\" ]*\)", line)
        if m:
            urls.append(base + '/' + m.group(1))
    os.chdir(cur)
    return urls

APPCACHE_TMPL = """CACHE MANIFEST

# Version %(version)s

CACHE:
%(cache)s

NETWORK:
%(network)s

FALLBACK:
%(fallback)s
"""

VERSIONJS_TMPL = """define(function(){return "%s";});"""

if __name__ == "__main__":
    if len(sys.argv) > 1:
        args = sys.argv[1:]
    else:
        args = []
    build(*args)
