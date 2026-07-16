"""Make the ``monthly_report`` package importable when running pytest from the
repository root (e.g. ``python3 -m pytest reporting/tests``)."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
