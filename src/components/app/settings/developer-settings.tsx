
'use client';

import { useMobileView } from "@/hooks/use-mobile-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function DeveloperSettings() {
    const { isMobileView, setIsMobileView } = useMobileView();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Developer Settings</h2>
                <p className="text-muted-foreground">
                    Settings for development and testing purposes.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Mobile App Testing (Beta)</CardTitle>
                    <CardDescription>
                        Force the mobile user interface to appear on your desktop client. This is useful for testing mobile layouts without resizing your window. A refresh is required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id="mobile-view-toggle"
                            checked={isMobileView}
                            onCheckedChange={(checked) => setIsMobileView(checked)}
                        />
                        <Label htmlFor="mobile-view-toggle">Enable Mobile UI</Label>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
