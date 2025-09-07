

'use client';

import { useMobileView } from "@/hooks/use-mobile-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { BadgeManager } from "./badge-manager";
import { Separator } from "@/components/ui/separator";

export function DeveloperSettings() {
    const { user } = useAuth();
    const { isMobileView, setIsMobileView, isPwaMode } = useMobileView();

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isPwaMode) return;
        
        // This is a hack to get the underlying Switch's state
        // because of the way the click event is handled on the label.
        const currentChecked = (e.currentTarget.previousSibling as HTMLButtonElement)?.dataset?.state === 'checked';
        setIsMobileView(!currentChecked);
    }

    const isHeina = user?.displayName === 'heina';

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
                            disabled={isPwaMode}
                            onClick={(e) => { e.preventDefault(); handleToggle(e); }}
                        />
                        <Label htmlFor="mobile-view-toggle" onClick={(e) => e.preventDefault()}>Enable Mobile UI</Label>
                    </div>
                     {isPwaMode && (
                        <Alert className="mt-4">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>This setting is locked because you are running the app in PWA mode (`?m=true`).</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <AlertDescription>
                                Mobile UI is permanently enabled when running in app mode.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {isHeina && (
                <>
                    <Separator />
                    <BadgeManager />
                </>
            )}
        </div>
    );
}
