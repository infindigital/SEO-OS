"""Make the ``seo_crawler`` package importable when running pytest from the
repository root (e.g. ``crawler/.venv/bin/python -m pytest crawler/tests``)."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
