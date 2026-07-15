"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DeveloperTaskView } from "@backend/application/developer-task/dto";

import {
  addTaskNoteAction,
  uploadScreenshotAction,
} from "@/app/(dashboard)/developer/actions";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import { CompletionBar } from "./completion-bar";
import { formatDate } from "../lib";
import type { DeveloperOption } from "../types";

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  developers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: DeveloperTaskView;
  developers: DeveloperOption[];
}) {
  const authorLabels = new Map(developers.map((dev) => [dev.id, dev.label]));
  const [noteBody, setNoteBody] = useState("");
  const [isSavingNote, startNote] = useTransition();
  const [isUploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLInputElement>(null);

  function submitNote() {
    const body = noteBody.trim();
    if (!body) {
      return;
    }
    startNote(async () => {
      const result = await addTaskNoteAction({ taskId: task.id, body });
      if (result.ok) {
        setNoteBody("");
        toast.success("Note added.");
      } else {
        toast.error(result.error);
      }
    });
  }

  async function submitScreenshot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose an image first.");
      return;
    }
    const formData = new FormData();
    formData.set("taskId", task.id);
    formData.set("caption", captionRef.current?.value ?? "");
    formData.set("file", file);

    setUploading(true);
    const result = await uploadScreenshotAction(formData);
    setUploading(false);

    if (result.ok) {
      toast.success("Screenshot uploaded.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (captionRef.current) captionRef.current.value = "";
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6">{task.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            <CompletionBar value={task.completion} />
          </DialogDescription>
        </DialogHeader>

        {task.description && (
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {task.description}
          </p>
        )}

        {/* Notes */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Notes</h3>
          {task.notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notes yet.</p>
          ) : (
            <ul className="space-y-2">
              {task.notes.map((note) => (
                <li key={note.id} className="bg-muted/50 rounded-md px-3 py-2 text-sm">
                  <p className="whitespace-pre-wrap">{note.body}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {note.authorId ? (authorLabels.get(note.authorId) ?? "Staff") : "Staff"}
                    {" · "}
                    {formatDate(note.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-2">
            <Textarea
              rows={2}
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              placeholder="Add a note…"
              aria-label="Add a note"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={submitNote}
                disabled={isSavingNote || noteBody.trim().length === 0}
              >
                {isSavingNote ? <Loader2 className="animate-spin" /> : <Send />}
                Add note
              </Button>
            </div>
          </div>
        </section>

        {/* Screenshots */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Screenshots</h3>
          {task.screenshots.length === 0 ? (
            <p className="text-muted-foreground text-sm">No screenshots yet.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {task.screenshots.map((shot) => (
                <li key={shot.id} className="rounded-md border p-2 text-xs">
                  {shot.url ? (
                    <a
                      href={shot.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {shot.caption || "View screenshot"}
                    </a>
                  ) : (
                    <span>{shot.caption || shot.path}</span>
                  )}
                  <p className="text-muted-foreground mt-1">
                    {formatDate(shot.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={submitScreenshot} className="space-y-2">
            <Input ref={fileInputRef} type="file" accept="image/*" aria-label="Screenshot file" />
            <Input ref={captionRef} placeholder="Caption (optional)" aria-label="Screenshot caption" />
            <div className="flex justify-end">
              <Button type="submit" size="sm" variant="outline" disabled={isUploading}>
                {isUploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                Upload screenshot
              </Button>
            </div>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
