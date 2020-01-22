import os
from setuptools import setup
from setuptools.command.build_py import build_py
import subprocess


LONG_DESCRIPTION = """
Offline-capable HTML5 web and hybrid apps for citizen science field data collection.
"""


class BuildJS(build_py):
    def run(self):
        subprocess.check_call(['make'])
        super().run()


def readme():
    try:
        readme = open('README.md')
    except IOError:
        return LONG_DESCRIPTION
    else:
        return readme.read()


def list_package_data(root):
    """
    List top level js, css, & scss folders for inclusion as package data
    """
    paths = []
    for base, dirs, files in os.walk(root):
        paths.extend([os.path.join(base, name) for name in files])
    return paths


def create_wq_namespace():
    """
    Generate the wq namespace package
    (not checked in, as it technically is the parent of this folder)
>    """
    if os.path.isdir("wq"):
        return
    os.makedirs("wq")
    init = open(os.path.join("wq", "__init__.py"), 'w')
    init.write("__import__('pkg_resources').declare_namespace(__name__)")
    init.close()


create_wq_namespace()

setup(
    name='wq.app',
    use_scm_version=True,
    author='S. Andrew Sheppard',
    author_email='andrew@wq.io',
    url='https://wq.io/wq.app',
    license='MIT',
    packages=['wq', 'wq.app', 'wq.app.build'],
    package_dir={
        'wq.app': '.',
        'wq.app.build': './build',
    },
    package_data={
        'wq.app': [
            'js/*',
            'js/*/*',
            'css/*',
            'css/*/*',
            'css/*/*/*',
            'scss/*',
            'scss/*/*',
        ],
    },
    include_package_data=True,
    install_requires=[
        'wq.core',
        'pyScss>=1.3',
        'compass-stylesheets==0.12.6',
        'PyYAML',
        'requests',
        'pystache',
        'Pillow',
        'requirejs>=0.2.0',
        'PyBabeljs',
    ],
    namespace_packages=['wq'],
    description=LONG_DESCRIPTION.strip(),
    long_description=readme(),
    long_description_content_type='text/markdown',
    entry_points={'wq': 'wq.app=wq.app.build'},
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'License :: OSI Approved :: MIT License',
        'Natural Language :: English',
        'Programming Language :: JavaScript',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Topic :: Software Development :: Libraries :: Application Frameworks',
        'Topic :: Text Processing :: Markup :: HTML',
        'Topic :: Scientific/Engineering :: GIS',
        'Topic :: Software Development :: Build Tools',
        'Topic :: Software Development :: Pre-processors',
    ],
    tests_require=[
        'html-json-forms',
    ],
    setup_requires=[
        'setuptools_scm',
    ],
    cmdclass={
        'build_py': BuildJS,
    },
    project_urls={
        'Homepage': 'https://wq.io/wq.app',
        'Documentation': 'https://wq.io/docs/',
        'Source': 'https://github.com/wq/wq.app',
        'Release Notes': 'https://github.com/wq/wq.app/releases',
        'Issues': 'https://github.com/wq/wq.app/issues',
        'CI': 'https://travis-ci.org/wq/wq.app',
    },
)
