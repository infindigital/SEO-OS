"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { publishReportSchema } from "@backend/interface/client-portal/client-portal.schemas";
import { z } from "zod";

import { publishReportAction } from "@/app/(dashboard)/portal/actions";

const formSchema = publishReportSchema.omit({ clientId: true });
type ReportFormValues = z.infer<typeof formSchema>;

const EMPTY: ReportFormValues = { title: "", period: "", summary: "", url: "" };

export function PublishReportDialog({
  open,
  onOpenChange,
  clientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}) {
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) {
      form.reset(EMPTY);
    }
  }, [open, form]);

  async function onSubmit(values: ReportFormValues) {
    const result = await publishReportAction({ clientId, ...values });
    if (result.ok) {
      toast.success("Report published.");
      onOpenChange(false);
      return;
    }
    if (result.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (field in values && messages[0]) {
          form.setError(field as keyof ReportFormValues, { message: messages[0] });
        }
      }
    }
    toast.error(result.error);
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish report</DialogTitle>
          <DialogDescription>
            Publish a client-facing report to this client&apos;s portal.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="July SEO performance report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period</FormLabel>
                  <FormControl>
                    <Input placeholder="July 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Highlights for the client…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…/report.pdf" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Publish
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
