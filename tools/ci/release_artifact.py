"""Seal one build and fail closed on local/hosted SHA or byte mismatches."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import quote
from urllib.request import Request, urlopen


def inventory(directory):
    files = {}
    for path in sorted(directory.rglob('*')):
        if path.is_symlink():
            raise ValueError(f'symlink in release: {path}')
        if path.is_file() and path != directory / 'release.json':
            files[path.relative_to(directory).as_posix()] = hashlib.sha256(
                path.read_bytes()).hexdigest()
    if 'index.html' not in files:
        raise ValueError('missing production build')
    return files


def valid_sha(sha):
    if not re.fullmatch(r'[a-f0-9]{40}', sha):
        raise ValueError('release requires a full commit SHA')


def seal(directory, sha):
    valid_sha(sha)
    manifest = {'sha': sha, 'files': inventory(directory)}
    (directory / 'release.json').write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + '\n')


def verify(directory, sha):
    valid_sha(sha)
    manifest = json.loads((directory / 'release.json').read_text())
    if manifest.get('sha') != sha:
        raise ValueError('release SHA mismatch')
    if manifest.get('files') != inventory(directory):
        raise ValueError('release file inventory or bytes mismatch')
    return manifest


def hosted(directory, sha, base):
    manifest = verify(directory, sha)

    def fetch(relative):
        url = base.rstrip('/') + '/' + quote(relative) + '?release=' + sha
        request = Request(url, headers={'Cache-Control': 'no-cache'})
        with urlopen(request, timeout=30) as response:
            return response.read()

    if fetch('release.json') != (directory / 'release.json').read_bytes():
        raise ValueError('hosted release manifest/SHA mismatch')

    def compare(item):
        relative, expected = item
        if hashlib.sha256(fetch(relative)).hexdigest() != expected:
            raise ValueError(f'hosted artifact mismatch: {relative}')

    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(compare, manifest['files'].items()))
    print(f'Hosted SHA {sha}: {len(manifest["files"])} files verified byte for byte')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['seal', 'verify', 'hosted'])
    parser.add_argument('--directory', type=Path, default=Path('dist'))
    parser.add_argument('--sha', required=True)
    parser.add_argument('--url')
    args = parser.parse_args()
    if args.command == 'seal':
        seal(args.directory, args.sha)
    elif args.command == 'verify':
        verify(args.directory, args.sha)
    else:
        if not args.url:
            parser.error('hosted requires --url')
        hosted(args.directory, args.sha, args.url)
