
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Github, MessageSquareText, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const Starfield = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(100)].map((_, i) => (
            <div
                key={i}
                className="absolute bg-white rounded-full star"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 2 + 1}px`,
                    height: `${Math.random() * 2 + 1}px`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                }}
            />
        ))}
    </div>
);

const Rain = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
            <div
                key={i}
                className="absolute w-px h-20 bg-gradient-to-b from-transparent to-white/30 raindrop"
                style={{
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    animationDelay: `${Math.random() * 5}s`,
                }}
            />
        ))}
    </div>
);

export default function LandingPage() {
    return (
        <div className="min-h-screen w-full bg-background text-foreground relative overflow-hidden">
            <Starfield />
            <Rain />

            <div className="relative z-10 flex flex-col min-h-screen">
                <header className="p-4 sm:p-6 flex justify-between items-center backdrop-blur-sm bg-background/50 border-b border-white/10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-2"
                    >
                        <MessageSquareText className="size-8 text-primary" />
                        <h1 className="text-2xl font-bold">Phunt</h1>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                         <Link href="https://github.com/PhuntLabs" target="_blank" rel="noopener noreferrer">
                             <Button variant="ghost" size="icon">
                                <Github className="size-6" />
                            </Button>
                        </Link>
                    </motion.div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="max-w-3xl"
                    >
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-400">
                            Your Space to Talk, Collaborate, and Play
                        </h2>
                        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
                            Phunt is a modern communication platform designed for communities of all sizes. Create a server for your friend group, your gaming clan, or your study club, and enjoy seamless text chat, high-quality voice calls, and powerful moderation tools, all for free.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                             <Link href="/channels/@me">
                                <Button size="lg" className="text-lg">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </main>

                <footer className="p-4 sm:p-6 text-center text-muted-foreground text-sm backdrop-blur-sm bg-background/50 border-t border-white/10">
                    &copy; {new Date().getFullYear()} PhuntLabs. All rights reserved.
                </footer>
            </div>
        </div>
    );
}

