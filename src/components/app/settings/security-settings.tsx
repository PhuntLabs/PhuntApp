
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export function SecuritySettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Security</h2>
      <p className="text-muted-foreground">Manage your security settings.</p>

       <Card className="mt-6">
        <CardContent className="pt-6">
           <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-48">
              <ShieldCheck className="size-12 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Coming Soon!</h3>
              <p>Advanced security options, including two-factor authentication, will be available here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
