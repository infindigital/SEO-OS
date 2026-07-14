# agents

AI agent definitions that power the SEO OS. Each agent encapsulates a role
(e.g. technical auditor, content strategist, keyword researcher, link
prospector) with its instructions, tools, and orchestration logic.

Agents are consumed by the application layer in `backend/` and surfaced through
the dashboard. Model-provider adapters and prompt assembly live alongside the
agent definitions here.
