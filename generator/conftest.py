"""Make the ``seo_audit_gen`` package importable when running pytest from the
repository root (e.g. ``python3 -m pytest generator/tests``)."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
