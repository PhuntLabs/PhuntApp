
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Bug } from "lucide-react";

export function BugReportSettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Bugs & Feedback</h2>
      <p className="text-muted-foreground">Report a bug or provide feedback to the developers.</p>

      <Card className="mt-6">
        <CardContent className="pt-6">
           <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-48">
              <Bug className="size-12 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Coming Soon!</h3>
              <p>A dedicated bug reporting and feedback system is on its way.</p>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
