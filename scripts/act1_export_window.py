"""Pure shared-window calculation in untrimmed, 1x export pixels.

Four transparent pixels cover the Lanczos3 downsample support (three export
pixels) plus one pixel for runtime linear sampling. Preserve the original cell;
extend only edges where measured bounds plus that filter apron require it.
"""
import math

FILTER_APRON = 4


def shared_window(bounds, original=(256, 256), root=(128, 210)):
    assert bounds and all(len(b) == 4 for b in bounds)
    assert all(all(math.isfinite(v) for v in b) and b[0] <= b[2] and b[1] <= b[3]
               for b in bounds)
    union = [min(b[0] for b in bounds), min(b[1] for b in bounds),
             max(b[2] for b in bounds), max(b[3] for b in bounds)]
    left = min(0, math.floor(union[0]) - FILTER_APRON)
    top = min(0, math.floor(union[1]) - FILTER_APRON)
    right = max(original[0], math.ceil(union[2]) + FILTER_APRON)
    bottom = max(original[1], math.ceil(union[3]) + FILTER_APRON)
    return {'left': left, 'top': top, 'width': right - left, 'height': bottom - top,
            'root': [root[0] - left, root[1] - top], 'filterApron': FILTER_APRON,
            'measuredBounds': union, 'supersample': 2, 'displayScale': .5}


def contains(window, bounds, tolerance=.001):
    apron = window['filterApron']
    return (bounds[0] >= apron - tolerance and bounds[1] >= apron - tolerance
            and bounds[2] <= window['width'] - apron + tolerance
            and bounds[3] <= window['height'] - apron + tolerance)
