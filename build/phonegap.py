import requests
from wq.core import wq
import click
import os
import yaml
import json
import shutil
import pystache
from .icons import icons, SIZES


@wq.command()
@click.option(
    '--source', type=click.Path(), help="Directory containing app assets"
)
@click.option('--icon', type=click.Path(), help="Source image for icons")
@click.option('--config-xml', type=click.Path(), help="config.xml template")
@click.option('--index-html', type=click.Path(), help="index.html template")
@click.option(
    '--pgb-directory', type=click.Path(), default=".wq-pgb",
    help="Temporary working directory (default .wq-pgb)"
)
@click.option(
    '--pgb-api', default="https://build.phonegap.com/api/v1/",
    help="PhoneGap Build API URL",
)
@click.option(
    '--pgb-token-api', default="https://build.phonegap.com/token",
    help="PhoneGap Build Token API URL",
)
@click.argument('version')
@wq.pass_config
@click.pass_context
def phonegap(ctx, config, version, **conf):
    """
    Upload application to PhoneGap Build.  Specifically,

    \b
    1. Create a working directory, if not present.
    2. Copy asset directory to working directory.
    3. (Optionally) Generate config.xml and index.html from mustache templates.
    4. Generate zip file.
    5. Request an authentication token from PhoneGap Build, if not present.
    6. Upload the zip file to PhoneGap build.
    7. Save the returned app ID for future builds.
    \b
    (Inspired by, but not dependent on, the `phonegap remote` api)
    """

    if conf['source']:
        source = conf['source']
    else:
        source = config.get('optimize', {}).get('dir', None)
        if not source:
            raise click.UsageError(
                "Set --source or define optimize section in wq.yml"
            )

    directory = conf['pgb_directory']

    if not os.path.exists(directory):
        choice = ''
        while choice.lower() not in ('y', 'n', 'd'):
            choice = click.prompt('Configure PhoneGap Build? [y/n/d/?]')
            if choice.lower() == '?':
                click.echo(
                    '  y - continue\n'
                    '  n - cancel for now\n'
                    '  d - cancel and disable\n'
                    '  ? - show help'
                )
        if choice == 'n':
            return
        else:
            os.mkdir(directory)
            if choice == 'd':
                set_pgb_config(directory, 'disable', True)

    if get_pgb_config(directory, 'disable'):
        click.echo(
            "PhoneGap Build disabled.  Remove {directory} to enable"
            .format(directory=directory)
        )
        return

    filename = create_zipfile(
        directory=directory,
        source=source,
        version=version,
        context=ctx,
        icon=conf['icon'],
        config_xml=conf['config_xml'],
        index_html=conf['index_html'],
    )

    token = get_token(directory, conf['pgb_token_api'])
    if not token:
        click.echo("No token found, stopping.", err=True)
        return

    upload_zipfile(directory, filename, token, conf['pgb_api'])


def create_zipfile(directory, source, version, context,
                   icon=None, config_xml=None, index_html=None):
    folder = os.path.join(directory, 'build')
    if os.path.exists(folder):
        shutil.rmtree(folder)
    shutil.copytree(source, folder)

    template_context = {
        'version': version,
    }

    if icon:
        icon_dir = 'icons'
        filename = '{alias}.png'
        platforms = (
            'android', 'ios', 'windows',
            'android-splash', 'ios-splash', 'windows-splash'
        )

        icon_path = os.path.join(directory, 'build', icon_dir)
        os.mkdir(icon_path)
        click.open_file(os.path.join(icon_path, '.pgbomit'), 'w').write('')

        def get_width(size):
            if isinstance(size, int):
                return size
            elif size.endswith('.9'):
                return int(size.replace('.9', ''))
            else:
                return int(size.split('x')[0])

        def get_height(size):
            if isinstance(size, int):
                return size
            elif size.endswith('.9'):
                return int(size.replace('.9', ''))
            else:
                return int(size.split('x')[1])

        for platform in platforms:
            context.invoke(
                icons,
                source=icon,
                outdir=icon_path,
                filename=filename,
                size=[platform],
            )
            sizes = [(
                get_width(size),
                get_height(size),
                size,
                alias,
            ) for size, alias in SIZES[platform].items()]
            template_context[platform] = {
                'icons': [{
                    'width': width,
                    'height': height,
                    'alias': alias,
                    'density': (
                        alias.replace('.9', '') if 'dpi' in alias else None
                    ),
                    'filename': os.path.join(
                        icon_dir,
                        filename.format(alias=alias)
                    )
                } for width, height, size, alias in sorted(sizes)]
            }

    if config_xml:
        xml = click.open_file(config_xml).read()
        xml = pystache.render(xml, template_context)
        click.open_file(os.path.join(folder, 'config.xml'), 'w').write(xml)

    if index_html:
        html = click.open_file(index_html).read()
        html = pystache.render(html, template_context)
        click.open_file(os.path.join(folder, 'index.html'), 'w').write(html)

    return shutil.make_archive(folder, 'zip', folder)


def upload_zipfile(directory, filename, token, pgb_api):
    pgb_url = pgb_api + "{path}?auth_token={token}"
    app_id = get_pgb_config(directory, 'app_id')
    if app_id:
        url = pgb_url.format(
            path='apps/{app_id}'.format(app_id=app_id),
            token=token,
        )
        method = 'put'
    else:
        url = pgb_url.format(
            path='apps',
            token=token,
        )
        method = 'post'

    response = requests.request(
        method,
        url,
        data={
            'data': json.dumps({'create_method': 'file'}),
        },
        files={
            'file': click.open_file(filename, 'rb'),
        }
    )
    if check_error(response):
        return
    result = response.json()
    if not app_id:
        set_pgb_config(directory, 'app_id', result['id'])
    click.echo("URL: {share_url}".format(share_url=result['share_url']))
    error = result.get('error', None)
    if error:
        click.echo("PGB Warning: {error}".format(error=error))


def get_pgb_config(directory, name=None):
    conf_path = os.path.join(directory, 'wq-pgb.yml')
    conf = {}
    if os.path.exists(conf_path):
        conf = yaml.load(click.open_file(conf_path))
        if not isinstance(conf, dict):
            conf = {}

    if name:
        return conf.get(name, None)
    else:
        return conf


def set_pgb_config(directory, name, value):
    conf = get_pgb_config(directory)
    conf_path = os.path.join(directory, 'wq-pgb.yml')
    conf[name] = value
    yaml.dump(conf, click.open_file(conf_path, 'w'), default_flow_style=False)


def check_error(response):
    if response.status_code in (200, 201):
        return False
    result = response.json()
    if 'error' in result:
        error = result['error']
    else:
        error = response.text
    click.echo("PGB Error: {error}".format(error=error), err=True)
    return True


def get_token(directory, token_url):
    token = get_pgb_config(directory, 'token')
    if token:
        return token

    click.echo(
        "Enter your Phonegap Build username and password to request an"
        " authentication token.  The token will be stored in"
        " {directory}/wq-pgb.yml."
        .format(
            directory=directory,
        )
    )
    username = click.prompt("Username")
    password = click.prompt("Password", hide_input=True)
    response = requests.post(token_url, auth=(username, password))

    if check_error(response):
        return

    token = response.json()['token']
    set_pgb_config(directory, 'token', token)
    return token
