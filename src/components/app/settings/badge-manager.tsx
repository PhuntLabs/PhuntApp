
'use client';

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Award, Plus } from 'lucide-react';
import { useBadges } from '@/hooks/use-badges';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const badgeIconOptions = [
    'Code', 'Beaker', 'PlaySquare', 'Clapperboard', 'Award', 'HeartHandshake', 'Bot',
    'Star', 'Shield', 'Trophy', 'Crown', 'Gem', 'Rocket', 'Zap', 'Flame', 'Sun', 'Moon',
    'Heart', 'Sprout', 'Feather'
];

export function BadgeManager() {
    const { addBadgeToUser, createBadge } = useAuth();
    const { badges, loading } = useBadges();
    const { toast } = useToast();

    // State for granting badges
    const [grantUsername, setGrantUsername] = useState('');
    const [grantBadgeId, setGrantBadgeId] = useState('');
    const [isGranting, setIsGranting] = useState(false);

    // State for creating badges
    const [newBadgeName, setNewBadgeName] = useState('');
    const [newBadgeColor, setNewBadgeColor] = useState('#808080');
    const [newBadgeIcon, setNewBadgeIcon] = useState('Award');
    const [isCreating, setIsCreating] = useState(false);

    const handleGrantSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!grantUsername.trim() || !grantBadgeId) {
            toast({
                variant: 'destructive',
                title: 'Missing fields',
                description: 'Please enter a username and select a badge to grant.',
            });
            return;
        }

        setIsGranting(true);
        try {
            await addBadgeToUser(grantUsername, grantBadgeId);
            const grantedBadge = badges.find(b => b.id === grantBadgeId);
            toast({
                title: 'Success!',
                description: `The '${grantedBadge?.name || 'badge'}' has been given to ${grantUsername}.`,
            });
            setGrantUsername('');
            setGrantBadgeId('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsGranting(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBadgeName.trim() || !newBadgeIcon || !newBadgeColor) {
             toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out all fields to create a badge.' });
             return;
        }
        setIsCreating(true);
        try {
            await createBadge({
                name: newBadgeName,
                icon: newBadgeIcon,
                color: newBadgeColor
            });
            toast({ title: 'Badge Created!', description: `The "${newBadgeName}" badge is now available.`});
            setNewBadgeName('');
            setNewBadgeColor('#808080');
            setNewBadgeIcon('Award');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Creating Badge', description: error.message });
        } finally {
            setIsCreating(false);
        }
    }
    
    const IconComponent = (LucideIcons as any)[newBadgeIcon] || LucideIcons.HelpCircle;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Grant a Badge</CardTitle>
                    <CardDescription>Grant an existing badge to a user by their username.</CardDescription>
                </CardHeader>
                <form onSubmit={handleGrantSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="grant-username">Username</Label>
                            <Input
                                id="grant-username"
                                value={grantUsername}
                                onChange={(e) => setGrantUsername(e.target.value)}
                                placeholder="Enter a user's exact username"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="grant-badge-select">Badge to Grant</Label>
                            <Select value={grantBadgeId} onValueChange={setGrantBadgeId}>
                                <SelectTrigger id="grant-badge-select">
                                    <SelectValue placeholder={loading ? "Loading badges..." : "Select a badge..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {badges.map(b => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isGranting || !grantUsername || !grantBadgeId}>
                            {isGranting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            <Award className="mr-2 size-4" />
                            Grant Badge
                        </Button>
                    </CardFooter>
                </form>
            </Card>

             <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Create a New Badge</CardTitle>
                    <CardDescription>Design and create a new custom badge that you can then grant to users.</CardDescription>
                </CardHeader>
                 <form onSubmit={handleCreateSubmit}>
                    <CardContent className="space-y-4">
                         <div className="space-y-1.5">
                            <Label htmlFor="create-badge-name">Badge Name</Label>
                            <Input
                                id="create-badge-name"
                                value={newBadgeName}
                                onChange={(e) => setNewBadgeName(e.target.value)}
                                placeholder="e.g., Top Contributor"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-badge-color">Badge Color</Label>
                                <Input
                                    id="create-badge-color"
                                    type="color"
                                    value={newBadgeColor}
                                    onChange={(e) => setNewBadgeColor(e.target.value)}
                                    className="p-1 h-10"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="create-badge-icon">Badge Icon</Label>
                                <Select value={newBadgeIcon} onValueChange={setNewBadgeIcon}>
                                    <SelectTrigger id="create-badge-icon">
                                        <SelectValue placeholder="Select an icon..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <ScrollArea className="h-64">
                                            {badgeIconOptions.map(iconName => {
                                                const Icon = (LucideIcons as any)[iconName];
                                                return (
                                                    <SelectItem key={iconName} value={iconName}>
                                                        <div className="flex items-center gap-2">
                                                            {Icon && <Icon className="size-4" />}
                                                            {iconName}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Preview</Label>
                             <div className="p-2 mt-1 bg-muted rounded-md flex justify-center items-center">
                                 <div 
                                    className="h-5 px-1.5 flex items-center gap-1 rounded-full"
                                    style={{
                                        color: newBadgeColor,
                                        backgroundColor: `${newBadgeColor}33` // Add alpha transparency
                                    }}
                                 >
                                    <IconComponent className="size-3" /> 
                                    <span className="text-xs font-semibold">{newBadgeName || 'Badge Name'}</span>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isCreating}>
                            {isCreating && <Loader2 className="mr-2 size-4 animate-spin" />}
                            <Plus className="mr-2 size-4" />
                            Create Badge
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
