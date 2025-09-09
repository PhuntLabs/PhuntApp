

'use client';

import { useMobileView } from "@/hooks/use-mobile-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Phone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { BadgeManager } from "./badge-manager";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function DeveloperSettings() {
    const { user, updateUserProfile } = useAuth();
    const { toast } = useToast();
    const { isMobileView, setIsMobileView, isPwaMode } = useMobileView();

    const handleToggle = () => {
        if (isPwaMode) return;
        setIsMobileView(!isMobileView);
    }
    
    const handleCallingToggle = async (enabled: boolean) => {
        try {
            await updateUserProfile({ callingEnabled: enabled });
            toast({
                title: `Calling ${enabled ? 'Enabled' : 'Disabled'}`,
                description: `You have ${enabled ? 'enabled' : 'disabled'} the beta calling features.`,
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
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

            <div className="p-4 rounded-lg animated-gradient text-white relative overflow-hidden">
                 <div className="absolute inset-0 bg-black/30"/>
                 <div className="relative z-10">
                    <AlertTitle className="text-white flex items-center gap-2"><Phone /> Calling with RTC (Beta)</AlertTitle>
                    <AlertDescription className="text-white/80 mt-2">
                        Enable or disable the WebRTC calling features. This feature is experimental and may have bugs. Please report any issues you encounter.
                    </AlertDescription>
                    <div className="flex items-center space-x-2 mt-4">
                        <Switch
                          id="calling-toggle"
                          checked={user?.callingEnabled}
                          onCheckedChange={handleCallingToggle}
                          className="data-[state=checked]:bg-white/90 data-[state=unchecked]:bg-white/20"
                        />
                        <Label htmlFor="calling-toggle" className="text-white/90">Enable Calling</Label>
                    </div>
                 </div>
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
                            onCheckedChange={handleToggle}
                        />
                        <Label htmlFor="mobile-view-toggle">Enable Mobile UI</Label>
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
