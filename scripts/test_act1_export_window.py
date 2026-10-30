"""Focused edge cases for measured-window containment and stable anchors."""
import unittest
from act1_export_window import shared_window, contains


class ExportWindowTests(unittest.TestCase):
    def test_measured_bottom_extension_without_scale_or_root_change(self):
        window = shared_window([[38.258, 17.314, 217.742, 269.270]])
        self.assertEqual((window['width'], window['height']), (256, 274))
        self.assertEqual(window['root'], [128, 210])
        self.assertTrue(contains(window, [38.258, 17.314, 217.742, 269.270]))
        self.assertFalse(contains({**window, 'height': 273}, [38.258, 17.314, 217.742, 269.270]))

    def test_negative_extents_shift_canvas_and_root_together(self):
        window = shared_window([[-8.2, -2.3, 270.4, 300.8]])
        self.assertEqual((window['left'], window['top']), (-13, -7))
        self.assertEqual(window['root'], [141, 217])
        self.assertTrue(contains(window, [4.8, 4.7, 283.4, 307.8]))

    def test_inside_poses_do_not_shrink_or_fit_original_cell(self):
        window = shared_window([[40, 50, 180, 230], [100, 100, 120, 120]])
        self.assertEqual((window['width'], window['height']), (256, 256))
        self.assertEqual(window['root'], [128, 210])

    def test_reject_nonfinite_reversed_and_empty_bounds(self):
        for bounds in [[], [[0, 0, float('nan'), 2]], [[2, 0, 1, 2]], [[0, 2, 1, 1]]]:
            with self.assertRaises(AssertionError):
                shared_window(bounds)


if __name__ == '__main__':
    unittest.main()
