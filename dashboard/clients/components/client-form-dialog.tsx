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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  clientFormSchema,
  type ClientFormValues,
} from "@backend/interface/client/client.schemas";
import type { ClientView } from "@backend/application/client/dto";

import {
  createClientAction,
  updateClientAction,
} from "@/app/(dashboard)/clients/actions";
import { CLIENT_STATUS_OPTIONS } from "../status";
import { toDateInputValue } from "../lib";
import type { OwnerOption } from "../types";

/** Sentinel for the "no owner" option, since Radix disallows empty item values. */
const UNASSIGNED = "__unassigned__";

function toDefaults(client?: ClientView): ClientFormValues {
  return {
    name: client?.name ?? "",
    website: client?.website ?? "",
    contactName: client?.contactName ?? "",
    contactEmail: client?.contactEmail ?? "",
    status: client?.status ?? "PROSPECT",
    ownerId: client?.ownerId ?? "",
    industry: client?.industry ?? "",
    monthlyRetainer:
      client?.monthlyRetainer != null ? String(client.monthlyRetainer) : "",
    seoScore: client?.seoScore != null ? String(client.seoScore) : "",
    lastAuditDate: toDateInputValue(client?.lastAuditAt ?? null),
    currentFocus: client?.currentFocus ?? "",
    notes: client?.notes ?? "",
  };
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  owners,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientView;
  owners: OwnerOption[];
}) {
  const isEdit = Boolean(client);
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: toDefaults(client),
  });

  useEffect(() => {
    if (open) {
      form.reset(toDefaults(client));
    }
  }, [open, client, form]);

  async function onSubmit(values: ClientFormValues) {
    const result =
      isEdit && client
        ? await updateClientAction({ id: client.id, ...values })
        : await createClientAction(values);

    if (result.ok) {
      toast.success(isEdit ? "Client updated." : "Client added.");
      onOpenChange(false);
      return;
    }

    if (result.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (field in values && messages[0]) {
          form.setError(field as keyof ClientFormValues, {
            message: messages[0],
          });
        }
      }
    }
    toast.error(result.error);
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit client" : "Add client"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this client's details."
              : "Create a new client workspace."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="jane@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CLIENT_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <Select
                      value={field.value === "" ? UNASSIGNED : field.value}
                      onValueChange={(value) =>
                        field.onChange(value === UNASSIGNED ? "" : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                        {owners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="E-commerce" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyRetainer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly retainer (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        placeholder="2500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="seoScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO score (0–100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        inputMode="numeric"
                        placeholder="72"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastAuditDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last audit</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="currentFocus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current focus</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Technical SEO & Core Web Vitals"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Anything worth remembering…"
                      {...field}
                    />
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
                {isEdit ? "Save changes" : "Add client"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
