import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gigaviz-bg text-gigaviz-cream">
      <div className="relative min-h-screen overflow-hidden px-4 py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gigaviz-magentaSoft blur-[120px]" />
          <div className="absolute bottom-[-30%] right-[-10%] h-[460px] w-[460px] rounded-full bg-gigaviz-accentSoft blur-[120px]" />
        </div>
        <div className="relative mx-auto flex w-full max-w-md flex-col items-center justify-center gap-6">
          <Card className="w-full bg-gigaviz-surface/80 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">{title}</CardTitle>
              {description ? (
                <CardDescription className="text-gigaviz-muted">
                  {description}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
          {footer ? <div className="text-sm text-gigaviz-muted">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
