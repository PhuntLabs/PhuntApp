
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Github, MessageSquare, Users, Palette, Gamepad2, Phone, Bot } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Starfield = () => {
    const [stars, setStars] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        const generateStars = () => {
            const newStars = [...Array(100)].map((_, i) => (
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
            ));
            setStars(newStars);
        };
        generateStars();
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {stars}
        </div>
    );
};


const Rain = () => {
    const [raindrops, setRaindrops] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        const generateRain = () => {
            const newRaindrops = [...Array(50)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-px h-20 bg-gradient-to-b from-transparent to-white/30 raindrop"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${0.5 + Math.random() * 0.5}s`,
                        animationDelay: `${Math.random() * 5}s`,
                    }}
                />
            ));
            setRaindrops(newRaindrops);
        };
        generateRain();
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {raindrops}
        </div>
    );
};

const FeatureSection = ({ children }: { children: React.ReactNode }) => {
    const controls = useAnimation();
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });

    useEffect(() => {
        if (inView) {
            controls.start('visible');
        }
    }, [controls, inView]);

    return (
        <motion.div
            ref={ref}
            animate={controls}
            initial="hidden"
            variants={{
                visible: { opacity: 1, y: 0 },
                hidden: { opacity: 0, y: 50 },
            }}
            transition={{ duration: 0.6 }}
        >
            {children}
        </motion.div>
    );
};

export default function LandingPage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="min-h-screen w-full bg-background text-foreground relative overflow-hidden">
            <div className="relative z-10 flex flex-col min-h-screen">
                 {/* Header */}
                <header className="fixed top-0 left-0 right-0 z-50 p-4 sm:p-6 flex justify-between items-center backdrop-blur-sm bg-background/50 border-b border-white/10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-2"
                    >
                        <MessageSquare className="size-8 text-primary" />
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

                {/* Hero Section */}
                <main className="flex-1 flex flex-col items-center justify-center text-center p-4 pt-24 md:pt-32 relative">
                    {isClient && (
                        <div className="absolute inset-0 z-0">
                            <Starfield />
                            <Rain />
                        </div>
                     )}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="max-w-3xl relative z-10"
                    >
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-400">
                            Your Space to Talk, Collaborate, and Play
                        </h2>
                        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
                            Phunt is a modern communication platform designed for communities of all sizes. Create a server for your friend group, your gaming clan, or your study club, and enjoy seamless text chat, powerful tools, and more.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                             <Link href="/login">
                                <Button size="lg" className="text-lg">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </main>

                {/* Features Section */}
                <section className="py-20 bg-secondary/30">
                    <div className="container mx-auto px-4">
                        <FeatureSection>
                            <h3 className="text-3xl font-bold text-center mb-12">Everything You Need to Connect</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="p-6 bg-card rounded-lg text-center border">
                                    <Users className="size-12 mx-auto text-primary mb-4" />
                                    <h4 className="text-xl font-semibold mb-2">Servers & Channels</h4>
                                    <p className="text-muted-foreground">Create dedicated spaces with multiple text channels for any topic.</p>
                                </div>
                                <div className="p-6 bg-card rounded-lg text-center border">
                                    <MessageSquare className="size-12 mx-auto text-primary mb-4" />
                                    <h4 className="text-xl font-semibold mb-2">Direct Messaging</h4>
                                    <p className="text-muted-foreground">Private, one-to-one conversations with your friends and colleagues.</p>
                                </div>
                                <div className="p-6 bg-card rounded-lg text-center border">
                                    <Palette className="size-12 mx-auto text-primary mb-4" />
                                    <h4 className="text-xl font-semibold mb-2">Profile Customization</h4>
                                    <p className="text-muted-foreground">Personalize your profile with banners, effects, and custom status.</p>
                                </div>
                                <div className="p-6 bg-card rounded-lg text-center border">
                                    <Gamepad2 className="size-12 mx-auto text-primary mb-4" />
                                    <h4 className="text-xl font-semibold mb-2">Game & Music Hub</h4>
                                    <p className="text-muted-foreground">Launch games and share your music activity directly in the app.</p>
                                </div>
                            </div>
                        </FeatureSection>
                    </div>
                </section>
                
                {/* Beta Features Section */}
                 <section className="py-20">
                    <div className="container mx-auto px-4">
                        <FeatureSection>
                             <h3 className="text-3xl font-bold text-center mb-4">Always Evolving</h3>
                             <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">We're constantly building. Here's a sneak peek at what's in beta and what's next.</p>
                            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                <div className="flex items-start gap-4 p-6 bg-card rounded-lg border">
                                    <div className="p-3 bg-primary/20 rounded-lg text-primary"><Phone className="size-8" /></div>
                                    <div>
                                        <h4 className="text-xl font-semibold mb-1">Voice & Video Calls</h4>
                                        <p className="text-muted-foreground">High-quality voice and video calls are in active development and available for beta testing.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-6 bg-card rounded-lg border">
                                    <div className="p-3 bg-primary/20 rounded-lg text-primary"><Bot className="size-8" /></div>
                                    <div>
                                        <h4 className="text-xl font-semibold mb-1">Bots & Slash Commands</h4>
                                        <p className="text-muted-foreground">Integrate bots into your server for polls, custom embeds, and moderation with simple slash commands.</p>
                                    </div>
                                </div>
                            </div>
                        </FeatureSection>
                    </div>
                </section>
                
                 {/* Final CTA Section */}
                <section className="py-20 bg-secondary/30">
                    <div className="container mx-auto px-4 text-center">
                         <FeatureSection>
                            <h3 className="text-4xl font-extrabold tracking-tight mb-4">Ready to Dive In?</h3>
                            <p className="text-muted-foreground text-lg mb-8">Join thousands of communities and start chatting today.</p>
                             <Link href="/login">
                                <Button size="lg" className="text-lg">
                                    Get Started for Free
                                </Button>
                            </Link>
                        </FeatureSection>
                    </div>
                </section>

                <footer className="p-4 sm:p-6 text-center text-muted-foreground text-sm border-t">
                    &copy; {new Date().getFullYear()} PhuntLabs. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
