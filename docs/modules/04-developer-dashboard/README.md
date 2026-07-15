# 04. Developer Dashboard

**Status:** Implemented

Task board for engineering work at `/developer` (staff only).

## Per task

Title, Priority (low/medium/high/critical), Assigned Developer, Due Date,
Status (open/in-progress/blocked/done), and Completion % — plus notes and
screenshots. Status and completion stay consistent (completing sets 100% + a
timestamp; partial progress moves an open task into progress).

## Actions

- **Mark Complete** / reopen (a completed task is 100% done with a timestamp)
- **Add Notes** — timestamped notes per task
- **Upload Screenshot** — image upload to Supabase Storage
  (bucket `task-screenshots`), attached to the task
- Create / edit tasks, filter by open-state, status, and assignee

Board KPI cards: Open Tasks, Completed, Overdue, Average Completion.

## Data

`developer_tasks` (+ `developer_task_notes`, `developer_task_screenshots`);
migration `add_developer_tasks`; the seed creates demo tasks.

- **Spec:** [`../../../PROJECT_SPEC.md`](../../../PROJECT_SPEC.md) → "Developer Dashboard"
- **Code:** `backend/*/developer-task`, `src/app/(dashboard)/developer`, `dashboard/developer`
