from wq.core import wq
import click

import os
from PIL import Image, ImageOps

SIZES = {
    'web': {
        180: 'apple-touch-icon',
        192: 'manifest-icon',
        512: 'manifest-splash-icon',
    },

    'android': {
        36: 'ldpi',
        48: 'mdpi',
        72: 'hdpi',
        96: 'xhdpi',
        144: 'xxhdpi',
        192: 'xxxhdpi',
    },

    'android-splash': {
        '100.9': 'ldpi.9',
        '160.9': 'mdpi.9',
        '240.9': 'hdpi.9',
        '360.9': 'xhdpi.9',
        '480.9': 'xxhdpi.9',
        '640.9': 'xxxhdpi.9',
    },

    'ios': {
        29: 'icon-small',
        40: 'icon-40',
        58: 'icon-small@2x',
        60: 'icon-60',
        76: 'icon-76',
        80: 'icon-40@2x',
        87: 'icon-small@3x',
        120: 'icon-40@3x',
        152: 'icon-76@2x',
        167: 'icon-83.5@2x',
        180: 'icon-60@3x',

        # iOS 6.1
        50: 'icon-50',
        57: 'icon',
        72: 'icon-72',
        100: 'icon-50@2x',
        114: 'icon@2x',
        144: 'icon-72@2x',
    },

    'ios-splash': {
        '320x480': 'Default',
        '640x960': 'Default@2x',
        '640x1136': 'Default-568h@2x',
        '750x1334': 'Default-667h@2x',
        '768x1024': 'Default-Portrait~ipad',
        '1024x768': 'Default-Landscape~ipad',
        '1242x2208': 'Default-Portrait-736h@3x',
        '1536x2048': 'Default-Portrait@2x~ipad',
        '2048x1536': 'Default-Landscape@2x~ipad',
        '2208x1242': 'Default-Landscape-736h@3x',
        2732: 'Default@2x~universal~anyany',
    },

    'windows': {
        30: 'Square30x30Logo',
        44: 'Square44x44Logo',
        50: 'StoreLogo',
        70: 'Square70x70Logo',
        71: 'Square71x71Logo',
        106: 'Square44x44Logo.scale-240',
        120: 'StoreLogo.scale-240',
        150: 'Square150x150Logo',
        170: 'Square71x71Logo.scale-240',
        310: 'Square310x310Logo',
        '310x150': 'Wide310x150Logo',
        360: 'Square150x150Logo.scale-240',
        '744x360': 'Wide310x150Logo.scale-240',
    },

    'windows-splash': {
        '620x300': 'SplashScreen',
        '1152x1920': 'SplashScreenPhone.scale-240',
    }
}

PLATFORMS = set()
ALIASES = {}
for platform, aliases in list(SIZES.items()):
    PLATFORMS.add(platform)
    for size, alias in aliases.items():
        SIZES[alias] = {size: alias}
        ALIASES.setdefault(size, {})
        ALIASES[size][platform] = alias


@wq.command()
@click.argument('source', type=click.Path(exists=True))
@click.option(
    '--size', '-s', multiple=True, help="Pixel size (or name of platform)",
)
@click.option(
    '--filename', '-n', default="icon-{size}.png",
    help="Filename template for output files"
)
@click.option(
    '--outdir', '-d', type=click.Path(), help="Output Directory"
)
def icons(**conf):
    """
    Generate resized icons from source image.  If no size is specified,
    generates all of the recommended icon sizes for web, Android, iOS, and
    Windows apps.
    """
    if not conf['size']:
        conf['size'] = SIZES.keys()
    elif all([isinstance(c, str) and len(c) == 1 for c in conf['size']]):
        conf['size'] = ("".join(conf['size']),)

    platform = None
    sizes = set()
    for size in conf['size']:
        if size in SIZES:
            sizes.update(SIZES[size].keys())
            if size in PLATFORMS and not platform:
                # Use first specified platform as default for icon aliases
                platform = size
        elif isinstance(size, int):
            sizes.add(size)
        elif size.isdigit():
            sizes.add(int(size))
        elif len(size.split('x')) == 2:
            sizes.add(size)
        elif size.endswith('.9'):
            sizes.add(size)

    if not sizes:
        click.echo("Size not recognized: %s" % str(conf['size']))
        return

    def sortkey(size):
        if isinstance(size, int):
            return size
        elif size.endswith('.9'):
            return float(size)
        else:
            return max(int(s) for s in size.split('x'))

    sort_sizes = [str(size) for size in sorted(sizes, key=sortkey)]
    if platform and len(conf['size']) == 1:
        platform_note = " for %s" % platform
    else:
        platform_note = ""
    click.echo(
        "Generating icons%s: %s" % (platform_note, ", ".join(sort_sizes))
    )

    if conf['outdir'] and not os.path.exists(conf['outdir']):
        os.mkdir(conf['outdir'])

    img = Image.open(conf['source'])
    for size in sizes:
        nine_patch = False
        if isinstance(size, int):
            width = height = minsize = size
        elif size.endswith('.9'):
            width = height = minsize = int(size.replace('.9', ''))
            nine_patch = True
        else:
            width, height = (int(s) for s in size.split('x'))
            minsize = min(width, height)
        minsize = min(minsize, img.width, img.height)

        icon = img.copy()
        icon.thumbnail((minsize, minsize), Image.ANTIALIAS)
        if width != minsize or height != minsize:
            left = (width - minsize) // 2
            right = width - minsize - left
            top = (height - minsize) // 2
            bottom = height - minsize - top
            fill = img.load()[0, 0]
            icon = ImageOps.expand(icon, (left, top, right, bottom), fill)

        aliases = ALIASES.get(size, {})
        if len(aliases.keys()) == 1:
            alias = list(aliases.values())[0]
        elif platform and platform in aliases:
            alias = aliases[platform]
        else:
            alias = 'icon-%s' % size

        if nine_patch:
            icon = ImageOps.expand(icon, (1, 1, 1, 1), (0, 0, 0, 0))
            data = icon.load()
            data[0, 1] = data[1, 0] = (0, 0, 0, 255)
            data[0, height] = data[width, 0] = (0, 0, 0, 255)

        name = conf['filename'].format(
            size=size,
            alias=alias,
        )
        if conf['outdir']:
            name = os.path.join(conf['outdir'], name)
        icon.save(name, 'PNG')
