
'use client';

import { Servers } from '@/components/app/servers';
import { useServers } from '@/hooks/use-servers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Sparkles, Heart } from 'lucide-react';
import Link from 'next/link';

export default function TurboPage() {
    const { servers, loading: userServersLoading, createServer } = useServers();

    return (
        <div className="flex h-screen bg-background/70">
            <Servers 
                servers={servers}
                loading={userServersLoading}
                onCreateServer={createServer}
                selectedServer={null}
                onSelectServer={() => {}}
                onSelectChat={() => {}}
            />
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-dots-pattern">
                <Card className="w-full max-w-2xl bg-card/90 backdrop-blur-sm shadow-2xl border-primary/20">
                     <div className="h-40 w-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-lg flex items-center justify-center flex-col p-6 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/20"/>
                        <Sparkles className="size-16 mb-2 drop-shadow-lg relative" />
                        <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg relative">Phunt Turbo</h1>
                    </div>
                    <CardContent className="p-8 text-center space-y-4">
                        <CardTitle className="text-2xl">This Project is Free, Forever.</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground">
                            Phunt is a passion project built for fun, and it will always be free to use with no ads. We believe in creating great software without barriers.
                        </CardDescription>
                        <p className="text-foreground">
                            If you enjoy using Phunt and want to support its development, you can contribute through one of the platforms below. Your support helps cover server costs and fuels future updates!
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                             <a href="https://www.buymeacoffee.com/phunt" target="_blank" rel="noopener noreferrer">
                                <Button className="w-full h-12 bg-[#FFDD00] text-black hover:bg-[#FFDD00]/90">
                                    <Image src="https://www.cdn.buymeacoffee.com/assets/img/guidelines/logo-mark-1.svg" alt="Buy Me A Coffee" width={24} height={24} className="mr-2"/>
                                    Buy Me a Coffee
                                </Button>
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer">
                                <Button className="w-full h-12 bg-[#FF424D] text-white hover:bg-[#FF424D]/90">
                                    <Heart className="mr-2"/>
                                    Support on Patreon
                                </Button>
                            </a>
                             <a href="#" target="_blank" rel="noopener noreferrer">
                                <Button className="w-full h-12 bg-[#0070BA] text-white hover:bg-[#0070BA]/90">
                                     <Image src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" width={20} height={20} className="mr-2 filter brightness-0 invert"/>
                                    PayPal
                                </Button>
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer">
                                <Button className="w-full h-12 bg-green-500 text-white hover:bg-green-600">
                                    Cash App
                                </Button>
                            </a>
                        </div>
                    </CardContent>
                </Card>
                 <Button variant="link" asChild className="mt-4">
                    <Link href="/channels/me">Back to the app</Link>
                </Button>
            </div>
        </div>
    )
}
