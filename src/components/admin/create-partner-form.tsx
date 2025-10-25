"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { z } from "zod";
import { toast } from "sonner";

const createPartnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

type CreatePartnerRequest = z.infer<typeof createPartnerSchema>;

export function CreatePartnerForm({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (createdId: string) => void;
  onCancel?: () => void;
}) {
  const form = useForm<CreatePartnerRequest>({
    resolver: zodResolver(createPartnerSchema),
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: CreatePartnerRequest) => {
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.error || `Failed to create partner (${res.status})`
        );
      }
      const created = await res.json();
      toast.success("Partner created successfully");
      onSuccess?.(created.id);
      form.reset();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create partner");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. HepiBite" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Official HepiBite Store" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">Create Partner</Button>
        </div>
      </form>
    </Form>
  );
}
