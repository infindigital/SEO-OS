"""Tunable thresholds for the technical SEO analysis.

Defaults mirror the TypeScript analyzer (`backend/domain/analysis/thresholds.ts`)
so both engines flag issues consistently.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AnalysisThresholds:
    #: Pages with fewer words than this are flagged as thin content.
    thin_content_word_count: int = 250
    #: Redirect chains with at least this many hops are flagged. The crawler
    #: records the hops taken *before* the final URL, so 1 already means the
    #: page was reached via a redirect.
    redirect_chain_min_hops: int = 1

    def to_dict(self) -> dict:
        return {
            "thinContentWordCount": self.thin_content_word_count,
            "redirectChainMinHops": self.redirect_chain_min_hops,
        }


DEFAULT_THRESHOLDS = AnalysisThresholds()
