"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  count,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {typeof count === "number" ? (
            <Badge variant="secondary">{count}</Badge>
          ) : null}
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
