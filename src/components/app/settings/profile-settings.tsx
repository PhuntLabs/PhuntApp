
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { AvatarEffect, ProfileEffect } from '@/lib/types';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Mock components for preview
const RainEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
            <div
                key={i}
                className="raindrop"
                style={{
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    height: '25px',
                }}
            />
        ))}
    </div>
);

const RageEffect = () => (
    <>
        <div className="avatar-effect-rage-pulse"></div>
        <div className="avatar-effect-rage-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="avatar-effect-rage-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="avatar-effect-rage-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 9C18.5523 9 19 8.55228 19 8C19 7.44772 18.5523 7 18 7C17.4477 7 17 7.44772 17 8C17 8.55228 17.4477 9 18 9Z" fill="currentColor"/>
                <path d="M18 13C18.5523 13 19 12.5523 19 12C19 11.4477 18.5523 11 18 11C17.4477 11 17 11.4477 17 12C17 12.5523 17.4477 13 18 13Z" fill="currentColor"/>
                <path d="M15 15C15.5523 15 16 14.5523 16 14C16 13.4477 15.5523 13 15 13C14.4477 13 14 13.4477 14 14C14 14.5523 14.4477 15 15 15Z" fill="currentColor"/>
                <path d="M11 15C11.5523 15 12 14.5523 12 14C12 13.4477 11.5523 13 11 13C10.4477 13 10 13.4477 10 14C10 14.5523 10.4477 15 11 15Z" fill="currentColor"/>
                <path d="M7 13C7.55228 13 8 12.5523 8 12C8 11.4477 7.55228 11 7 11C6.44772 11 6 11.4477 6 12C6 12.5523 6.44772 13 7 13Z" fill="currentColor"/>
                <path d="M7 9C7.55228 9 8 8.55228 8 8C8 7.44772 7.55228 7 7 7C6.44772 7 6 7.44772 6 8C6 8.55228 6.44772 9 7 9Z" fill="currentColor"/>
            </svg>
        </div>
    </>
);

const GlowEffect = () => <div className="avatar-effect-glow"></div>;
const OrbitEffect = () => <div className="avatar-effect-orbit"></div>;
const SparkleEffect = () => (
    <div className="avatar-effect-sparkle">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="sparkle" style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animationDelay: `${Math.random() * 1.5}s`
            }}/>
        ))}
    </div>
);
const BounceEffect = ({ children }: { children: React.ReactNode }) => <div className="avatar-effect-bounce">{children}</div>;
const SnowEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
            <div key={i} className="snowflake" style={{ left: `${Math.random() * 100}%`, fontSize: `${Math.random() * 10 + 8}px`, animationDuration: `${2 + Math.random() * 3}s`, animationDelay: `${Math.random() * 5}s` }}>●</div>
        ))}
    </div>
);
const AuroraEffect = () => <div className="aurora"></div>;
const StarfieldEffect = () => (
     <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
            <div key={i} className="star" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${1.5 + Math.random() * 1}s` }}/>
        ))}
    </div>
);
const ConfettiEffect = () => {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(25)].map((_, i) => (
                 <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, backgroundColor: colors[Math.floor(Math.random() * colors.length)], animationDelay: `${Math.random() * 3}s` }} />
            ))}
        </div>
    );
};


const avatarEffects: { id: AvatarEffect, name: string, component: React.FC | React.FC<{ children: React.ReactNode }> }[] = [
    { id: 'none', name: 'None', component: () => null },
    { id: 'rage', name: 'Rage', component: RageEffect },
    { id: 'glow', name: 'Glow', component: GlowEffect },
    { id: 'orbit', name: 'Orbit', component: OrbitEffect },
    { id: 'sparkle', name: 'Sparkle', component: SparkleEffect },
    { id: 'bounce', name: 'Bounce', component: ({ children }) => <div className="avatar-effect-bounce">{children}</div> },
];

const profileEffects: { id: ProfileEffect, name: string, component: React.FC }[] = [
    { id: 'none', name: 'None', component: () => null },
    { id: 'rain', name: 'Rain', component: RainEffect },
    { id: 'snow', name: 'Snow', component: SnowEffect },
    { id: 'aurora', name: 'Aurora', component: AuroraEffect },
    { id: 'starfield', name: 'Starfield', component: StarfieldEffect },
    { id: 'confetti', name: 'Confetti', component: ConfettiEffect },
];

const nameplates = [
    { id: 'none', name: 'None', url: '' },
    { id: 'cityscape', name: 'Cityscape', url: 'https://picsum.photos/seed/cityscape/400/80', hint: 'city buildings' },
    { id: 'forest', name: 'Forest', url: 'https://picsum.photos/seed/forest/400/80', hint: 'forest trees' },
    { id: 'galaxy', name: 'Galaxy', url: 'https://picsum.photos/seed/galaxy/400/80', hint: 'galaxy stars' },
    { id: 'ocean', name: 'Ocean', url: 'https://picsum.photos/seed/ocean/400/80', hint: 'ocean wave' },
];


export function ProfileSettings() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const [avatarEffect, setAvatarEffect] = useState<AvatarEffect>('none');
  const [profileEffect, setProfileEffect] = useState<ProfileEffect>('none');
  const [nameplateUrl, setNameplateUrl] = useState<string>('');
  const [customNameplateInput, setCustomNameplateInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (user) {
      setAvatarEffect(user.avatarEffect || 'none');
      setProfileEffect(user.profileEffect || 'none');
      setNameplateUrl(user.nameplateUrl || '');
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await updateUserProfile({ avatarEffect, profileEffect, nameplateUrl });
        toast({ title: 'Profile Effects Updated', description: 'Your new look has been saved.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  }

  const handleSetCustomNameplate = () => {
      if (customNameplateInput.trim()) {
          setNameplateUrl(customNameplateInput.trim());
          toast({ title: 'Custom Nameplate Set!', description: 'Your custom nameplate is ready. Click "Save All Changes" to apply it.' });
      } else {
          toast({ variant: 'destructive', title: 'Invalid URL', description: 'Please enter a valid image URL.' });
      }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profiles</h2>
        <p className="text-muted-foreground">Customize your profile with effects and more.</p>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Avatar Decoration</CardTitle>
            <CardDescription>Add a special effect that appears around your avatar across the app.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
           {avatarEffects.map(effect => {
                const EffectComponent = effect.component;
                const isBounce = effect.id === 'bounce';

                return (
                    <div 
                        key={effect.id}
                        onClick={() => setAvatarEffect(effect.id)}
                        className={cn(
                            "relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all h-40",
                            avatarEffect === effect.id ? "border-primary bg-primary/10" : "border-transparent bg-muted/50 hover:bg-accent"
                        )}
                    >
                        <div className={cn("relative", isBounce && "w-20 h-20 flex items-center justify-center")}>
                            {isBounce ? (
                                <BounceEffect>
                                    <Avatar className="size-20">
                                        <AvatarImage src={user.photoURL || undefined} />
                                        <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                                    </Avatar>
                                </BounceEffect>
                            ) : (
                                <Avatar className="size-20">
                                    <AvatarImage src={user.photoURL || undefined} />
                                    <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                                </Avatar>
                            )}
                            {!isBounce && <EffectComponent />}
                        </div>
                        <span className="font-medium text-sm mt-2">{effect.name}</span>
                    </div>
                )
           })}
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
            <CardTitle>Profile Effect</CardTitle>
            <CardDescription>Add an animated effect to your profile card banner.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {profileEffects.map(effect => (
                <div
                    key={effect.id}
                    onClick={() => setProfileEffect(effect.id)}
                    className={cn(
                        "relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                         profileEffect === effect.id ? "border-primary bg-primary/10" : "border-transparent bg-muted/50 hover:bg-accent"
                    )}
                >
                    <div className="w-full h-32 bg-accent rounded-lg relative overflow-hidden flex flex-col items-center justify-end p-2">
                        <effect.component />
                        <div className="relative z-10 w-full bg-background/50 backdrop-blur-sm p-2 rounded-md border">
                            <div className="flex items-center gap-2">
                                <Avatar className="size-10">
                                     <AvatarImage src={user.photoURL || undefined} />
                                     <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">{user.displayName}</p>
                                    <p className="text-xs text-muted-foreground">Previewing effect...</p>
                                </div>
                            </div>
                        </div>

                    </div>
                     <span className="font-medium text-sm">{effect.name}</span>
                </div>
           ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Nameplate</CardTitle>
            <CardDescription>Make your name stand out in servers and chats with a custom background.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nameplates.map(plate => (
                    <div
                        key={plate.id}
                        onClick={() => setNameplateUrl(plate.url)}
                        className={cn(
                            "relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                            nameplateUrl === plate.url ? "border-primary bg-primary/10" : "border-transparent bg-muted/50 hover:bg-accent"
                        )}
                    >
                        <div className="w-full h-16 bg-accent rounded-lg relative overflow-hidden flex flex-col items-center justify-center p-2">
                            {plate.url ? (
                                <Image src={plate.url} alt={plate.name} fill className="object-cover" data-ai-hint={plate.hint} />
                            ): (
                                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">Default</div>
                            )}
                            <div className="relative z-10 w-full bg-black/30 backdrop-blur-sm p-2 rounded-md">
                                <div className="flex items-center gap-2">
                                    <Avatar className="size-8">
                                        <AvatarImage src={user.photoURL || undefined} />
                                        <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-bold text-white text-shadow-md">{user.displayName}</p>
                                </div>
                            </div>

                        </div>
                        <span className="font-medium text-sm">{plate.name}</span>
                    </div>
                ))}
            </div>
            <div className="pt-4">
                <Label htmlFor="custom-nameplate-url">Custom Nameplate URL</Label>
                <div className="flex items-center gap-2 mt-1">
                    <Input 
                        id="custom-nameplate-url"
                        placeholder="https://your.image/url.png"
                        value={customNameplateInput}
                        onChange={(e) => setCustomNameplateInput(e.target.value)}
                    />
                    <Button onClick={handleSetCustomNameplate}>Set</Button>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

    </div>
  );
}
