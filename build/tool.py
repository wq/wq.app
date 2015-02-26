from __future__ import print_function

import sys
from . import Builder


def usage():
    print("""Usage: wq [command] [version] [configfile]

Valid commands:
   appcache
   build
   collectjson
   init
   mustache
   optimize
   scss
   setversion
""")


def run():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if len(sys.argv) > 2:
        args = sys.argv[2:]
    else:
        args = []
    if cmd == "":
        usage()
        exit()

    builder = Builder(*args)
    if cmd in builder.COMMANDS:
        builder.run(cmd)
    else:
        fn = getattr(builder, cmd, None)
        if fn is not None:
            fn()
        else:
            usage()
