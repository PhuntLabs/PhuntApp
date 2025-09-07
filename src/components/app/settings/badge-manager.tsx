'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_BADGES, BadgeType } from '@/lib/types';
import { Loader2, Award } from 'lucide-react';

export function BadgeManager() {
    const { addBadgeToUser } = useAuth();
    const { toast } = useToast();
    const [username, setUsername] = useState('');
    const [badge, setBadge] = useState<BadgeType | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !badge) {
            toast({
                variant: 'destructive',
                title: 'Missing fields',
                description: 'Please enter a username and select a badge.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await addBadgeToUser(username, badge);
            toast({
                title: 'Success!',
                description: `The '${badge}' badge has been given to ${username}.`,
            });
            setUsername('');
            setBadge('');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Badge Manager</CardTitle>
                <CardDescription>Grant special badges to users. This is a privileged action.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="badge-username">Username</Label>
                        <Input
                            id="badge-username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter a user's exact username"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="badge-select">Badge</Label>
                        <Select value={badge} onValueChange={(value) => setBadge(value as BadgeType)}>
                            <SelectTrigger id="badge-select">
                                <SelectValue placeholder="Select a badge to grant..." />
                            </SelectTrigger>
                            <SelectContent>
                                {ALL_BADGES.map(b => (
                                    <SelectItem key={b} value={b}>
                                        {b.charAt(0).toUpperCase() + b.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting || !username || !badge}>
                        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                        <Award className="mr-2 size-4" />
                        Grant Badge
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
