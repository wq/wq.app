#!/usr/bin/python

from subprocess import call
import json
import os
import sys
import re

def build(version=None, buildconfig="app.build.json", acconfig="app.cache.json"):
    # Load configuration files
    if (version is None):
        version = open('version.txt').read().strip()
    else:
        open('version.txt', 'w').write(version)
    bconf  = json.load(open(buildconfig))
    acconf = json.load(open(acconfig))
    
    # Update version.js
    vjs = open('%s/version.js' % bconf['baseUrl'], 'w')
    vjs.write(VERSIONJS_TMPL % version);

    # Build Javascript (using r.js)
    call(["r.js", "-o", buildconfig])

    # Create app caches for both source and build directory
    generate_appcache(version, bconf, acconf)

def generate_appcache(version, bconf, acconf):

    # Open output files
    s_ac  = open(acconf['name'], 'w')
    b_ac  = open(bconf['dir'] + '/' + acconf['name'], 'w')

    # Start in source directory - read @imports from main CSS file
    s_css = [acconf['css']]
    s_css.extend(parse_css_urls(acconf['css']))

    # Change to build directory
    os.chdir(bconf['dir'])

    # Built CSS file contains image URLs from the @import-ed CSS files above
    images = parse_css_urls(acconf['css'])
 
    # build.txt contains alist of built javascript files and their sources
    s_js, b_js = parse_js_buildfile('build.txt')
    
    b_css = [acconf['css']]

    # Collect path names and create appcaches
    cache        = list(acconf['cache'])
    source_cache = cache + s_js + s_css + images
    built_cache  = cache + b_js + b_css + images

    network      = list(acconf['network'])
    fallback     = list(acconf['fallback'])

    s_ac.write(APPCACHE_TMPL % {
        'version': version + '_dev',
        'cache':    '\n'.join(source_cache),
        'network':  '\n'.join(network),
        'fallback': '\n'.join(fallback)
    })
    b_ac.write(APPCACHE_TMPL % {
        'version':  version,
        'cache':    '\n'.join(built_cache),
        'network':  '\n'.join(network),
        'fallback': '\n'.join(fallback)
    })

def parse_js_buildfile(filename):
    text = open(filename).read()
    sources = []
    built   = []
    for group in text[1:].split('\n\n'):
        files = group.split('\n')
        
        sources.extend(files[2:])
        built.append(files[0])

    return sources, built

def parse_css_urls(filename):
    text = open(filename).read()
    base = os.path.dirname(filename)
    urls = []
    for line in text.split('\n'):
        m = re.search(r"url\(['\" ]*(.+?)['\" ]*\)", line)
        if m:
            urls.append(base + '/' + m.group(1))
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
