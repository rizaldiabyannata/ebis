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
import Image from "next/image";

const createPartnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url().optional(),
});

type CreatePartnerRequest = z.infer<typeof createPartnerSchema>;

export function CreatePartnerForm({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (createdId: string) => void;
  onCancel?: () => void;
}) {
  const [imageMeta, setImageMeta] = React.useState<{
    fileName?: string;
    preview?: string;
    uploading?: boolean;
  } | null>(null);

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
        <FormItem>
          <FormLabel>Partner Image</FormLabel>
          <FormControl>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const preview = URL.createObjectURL(file);
                setImageMeta({
                  fileName: file.name,
                  preview,
                  uploading: true,
                });

                const data = new FormData();
                data.append("file", file);

                try {
                  const res = await fetch("/api/upload", {
                    method: "POST",
                    body: data,
                  });
                  if (!res.ok) throw new Error("Upload failed");

                  const json = await res.json();
                  const absoluteUrl = `${window.location.origin}${json.url}`;
                  form.setValue("imageUrl", absoluteUrl, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setImageMeta((prev) => ({
                    ...prev,
                    uploading: false,
                  }));
                  toast.success("Image uploaded");
                } catch (err: any) {
                  setImageMeta((prev) => ({
                    ...prev,
                    uploading: false,
                  }));
                  toast.error(
                    `Upload failed: ${
                      err.message || "An unknown error occurred"
                    }`
                  );
                }
              }}
            />
          </FormControl>
          <FormMessage />
          {imageMeta?.preview || form.watch("imageUrl") ? (
            <div className="mt-2 flex items-center gap-3">
              {(() => {
                const src = imageMeta?.preview || form.watch("imageUrl");
                if (!src) return null;
                if (
                  typeof src === "string" &&
                  (src.startsWith("blob:") || src.startsWith("data:"))
                ) {
                  return (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={String(src)}
                        alt="Partner preview"
                        className="border object-cover rounded h-12 w-12"
                      />
                    </>
                  );
                }
                return (
                  <Image
                    src={String(src)}
                    alt="Partner preview"
                    width={48}
                    height={48}
                    className="border object-cover rounded"
                  />
                );
              })()}
              <div className="text-muted-foreground text-xs">
                {imageMeta?.fileName || "Uploaded"}
              </div>
              {imageMeta?.uploading && (
                <div className="text-xs">Uploading...</div>
              )}
            </div>
          ) : null}
        </FormItem>

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
