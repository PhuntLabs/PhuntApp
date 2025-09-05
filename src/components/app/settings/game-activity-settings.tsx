
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Gamepad, Play, StopCircle } from 'lucide-react';
import type { CustomGame } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function GameActivitySettings() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const [gameName, setGameName] = useState('');
  const [gameDesc, setGameDesc] = useState('');
  const [gameImage, setGameImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddGame = async () => {
    if (!user || !gameName.trim() || !gameImage.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Game Name and Image URL are required.',
      });
      return;
    }

    setIsSaving(true);
    const newGame: CustomGame = {
      id: uuidv4(),
      name: gameName.trim(),
      description: gameDesc.trim(),
      imageUrl: gameImage.trim(),
    };

    const updatedGames = [...(user.customGames || []), newGame];

    try {
      await updateUserProfile({ customGames: updatedGames });
      toast({ title: 'Game Added!', description: `${newGame.name} has been added to your library.` });
      setGameName('');
      setGameDesc('');
      setGameImage('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveGame = async (gameId: string) => {
    if (!user) return;
    const updatedGames = user.customGames?.filter(g => g.id !== gameId) || [];
    try {
      await updateUserProfile({ customGames: updatedGames });
      toast({ title: 'Game Removed' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleSetPlaying = async (game: CustomGame) => {
     if (!user) return;
     try {
        await updateUserProfile({ 
            currentGame: game,
            customStatus: `Playing ${game.name}`
        });
        toast({ title: "You're now playing!", description: `Your status has been updated to show you're playing ${game.name}.`});
     } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
     }
  };

  const handleStopPlaying = async () => {
    if (!user) return;
     try {
        await updateUserProfile({ 
            currentGame: null,
            customStatus: ''
        });
        toast({ title: "Status Cleared", description: "You are no longer playing a game."});
     } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
     }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Game Activity</h2>
        <p className="text-muted-foreground">Add custom games to display on your profile when you're playing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a New Game</CardTitle>
          <CardDescription>Add a game you play to your library. This will not make the game playable in the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="game-name">Game Name</Label>
            <Input id="game-name" value={gameName} onChange={e => setGameName(e.target.value)} placeholder="e.g., Rocket League" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="game-desc">Description (Optional)</Label>
            <Textarea id="game-desc" value={gameDesc} onChange={e => setGameDesc(e.target.value)} placeholder="A short description of the game." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="game-image">Image URL</Label>
            <Input id="game-image" value={gameImage} onChange={e => setGameImage(e.target.value)} placeholder="Link to a game logo or box art" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleAddGame} disabled={isSaving}>
            <Plus className="mr-2" />
            {isSaving ? 'Adding...' : 'Add Game to Library'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Game Library</CardTitle>
          <CardDescription>Set your status to show what you're playing.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(user?.customGames || []).length > 0 ? (
              user?.customGames?.map(game => (
                <div key={game.id} className="flex items-center gap-4 p-2 border rounded-lg">
                  <Image src={game.imageUrl} alt={game.name} width={48} height={48} className="rounded-md" />
                  <div className="flex-1">
                    <p className="font-semibold">{game.name}</p>
                    <p className="text-sm text-muted-foreground">{game.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     {user.currentGame?.id === game.id ? (
                        <Button variant="secondary" onClick={handleStopPlaying}>
                            <StopCircle className="mr-2"/> Stop Playing
                        </Button>
                     ) : (
                         <Button variant="outline" onClick={() => handleSetPlaying(game)}>
                            <Play className="mr-2"/> Set as Playing
                        </Button>
                     )}
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 />
                            </Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove "{game.name}" from your library. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveGame(game.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Remove
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Gamepad className="mx-auto size-12 mb-2" />
                <p>You haven't added any custom games yet.</p>
                <p className="text-sm">Use the form above to add your favorite games.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
