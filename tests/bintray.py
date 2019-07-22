from setuptools_scm import get_version
import json
import datetime
import subprocess


def generate_bintray():
    version = get_version(root='..', relative_to=__file__)
    if 'dev' in version:
        tag = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            stdout=subprocess.PIPE
        ).stdout.decode('utf-8').strip()
        desc = "Development Version"
    else:
        tag = "v" + version
        desc = "Release Version"
    return {
        "package": {
            "name": "wq.app",
            "repo": "wq.app",
            "subject": "wq",
            "vcs_url": "https://github.com/wq/wq.app.git",
            "licenses": ["MIT"],
        },
        "version": {
            "name": version,
            "desc": desc,
            "released": str(datetime.date.today()),
            "vcs_tag": tag,
        },
        "files": [
            {"includePattern": r"dist/(.+\.whl)", "uploadPattern": "$1"}
        ],
        "publish": True
    }


if __name__ == '__main__':
    print(json.dumps(generate_bintray(), indent=4))
