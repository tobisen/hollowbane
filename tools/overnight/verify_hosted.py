#!/usr/bin/env python3
"""Compare every built publication file with the hosted artifact, byte for byte."""
import hashlib
from pathlib import Path
import sys
from urllib.request import Request, urlopen


def verify(base, directory):
    files = sorted(path for path in directory.rglob('*') if path.is_file())
    if not files or not (directory / 'index.html').is_file():
        raise RuntimeError('missing production build')
    for path in files:
        relative = path.relative_to(directory).as_posix()
        request = Request(base.rstrip('/') + '/' + relative,
                          headers={'Cache-Control': 'no-cache'})
        with urlopen(request, timeout=30) as response:
            actual = response.read()
        if hashlib.sha256(actual).digest() != hashlib.sha256(path.read_bytes()).digest():
            raise RuntimeError(f'hosted artifact mismatch: {relative}')
    print(f'Hosted artifact identity verified: {len(files)} files')


if __name__ == '__main__':
    verify(sys.argv[1], Path('dist'))
