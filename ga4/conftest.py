"""Make the ``ga4_sync`` package importable when running pytest from the
repository root (e.g. ``python3 -m pytest ga4/tests``)."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
