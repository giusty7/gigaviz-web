"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import type { HubDef } from "@/lib/hubs";
import { COPY_EN } from "@/lib/copy/en";
import { cn } from "@/lib/utils";

export function HubPreviewPage({ hub, workspaceSlug }: { hub: HubDef; workspaceSlug: string }) {
  const { toast } = useToast();
  const isOpen = hub.status === "OPEN";
  const targetHref = `/${workspaceSlug}/${hub.slug}`;
  const copy = COPY_EN.hubs;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("uppercase tracking-wide", isOpen ? "text-emerald-500" : "text-amber-500")}
            >
              {isOpen ? copy.statusOpen : copy.statusComingSoon}
            </Badge>
            <p className="text-sm text-muted-foreground">{copy.workspacePreview}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.overview}</p>
            <p className="text-sm text-muted-foreground">{hub.title}</p>
            <h1 className="text-2xl font-semibold leading-tight">{hub.description}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <Link href={targetHref}>
              <Button size="sm">{copy.open}</Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast({ title: copy.notifyToast })}
            >
              {copy.notifyMe}
            </Button>
          )}
        </div>
      </div>

      <Card className="border-gigaviz-border/70 bg-gigaviz-card/70">
        <CardHeader>
          <CardTitle className="text-base">{copy.howItWorks}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3">
            {hub.flow.map((step, idx) => (
              <li key={step.title} className="flex gap-3">
                <div className="mt-1 h-6 w-6 rounded-full bg-gigaviz-gold/15 text-center text-xs font-semibold text-gigaviz-gold">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="border-gigaviz-border/70 bg-gigaviz-card/70">
        <CardHeader>
          <CardTitle className="text-base">{copy.whatYouCanDo}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 md:grid-cols-2">
            {hub.bullets.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-gigaviz-border bg-gigaviz-surface/60 px-3 py-2 text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {!isOpen && (
        <Card className="border-gigaviz-border/70 bg-gigaviz-card/70">
          <CardHeader>
            <CardTitle className="text-base">{copy.whatsNext}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>{copy.whatsNextBody}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast({ title: copy.notifyToast })}
            >
              {copy.notifyMe}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
