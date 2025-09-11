
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Github, MessageSquare, Users, Palette, Gamepad2, Phone, Bot, Shield, Code, Settings, PlusCircle, ArrowRight, Eye, Link as LinkIcon } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

const Starfield = () => {
    const [stars, setStars] = useState<React.ReactNode[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        if (isClient) {
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
        }
    }, [isClient]);

    if (!isClient) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {stars}
        </div>
    );
};


const Rain = () => {
    const [raindrops, setRaindrops] = useState<React.ReactNode[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
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
        }
    }, [isClient]);

    if (!isClient) return null;

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
        threshold: 0.1,
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

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="p-6 bg-card rounded-xl text-center border flex flex-col items-center shadow-lg transform hover:scale-105 transition-transform duration-300">
        <div className="p-3 bg-primary/20 rounded-lg text-primary mb-4">
            <Icon className="size-8" />
        </div>
        <h4 className="text-xl font-semibold mb-2">{title}</h4>
        <p className="text-muted-foreground text-sm flex-1">{description}</p>
    </div>
);

export default function LandingPage() {
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
                        className="flex items-center gap-2"
                    >
                         <Link href="/login">
                            <Button variant="secondary" size="sm">Login</Button>
                         </Link>
                         <Link href="https://github.com/PhuntLabs" target="_blank" rel="noopener noreferrer">
                             <Button variant="ghost" size="icon">
                                <Github className="size-6" />
                            </Button>
                        </Link>
                    </motion.div>
                </header>

                {/* Hero Section */}
                <main className="flex-1 flex flex-col items-center justify-center text-center p-4 pt-24 md:pt-32 relative">
                    <div className="absolute inset-0 z-0">
                        <Starfield />
                        <Rain />
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="max-w-4xl relative z-10"
                    >
                        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-400">
                            Your Place to Talk, Hang Out, and Create
                        </h2>
                        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                           Phunt is the easiest way to communicate over voice, video, and text. Chat, hang out, and stay close with your friends and communities. Create a server, invite your friends, and start talking.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                             <Link href="/login">
                                <Button size="lg" className="text-lg px-8 py-6">
                                    Get Started Free <ArrowRight className="ml-2"/>
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </main>

                {/* Core Features Section */}
                <section className="py-20 bg-secondary/30">
                    <div className="container mx-auto px-4">
                        <FeatureSection>
                            <h3 className="text-3xl font-bold text-center mb-12">All-in-One Communication</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <FeatureCard icon={Users} title="Servers & Channels" description="Create dedicated spaces with multiple text channels for any topic. Organize your community and keep conversations focused." />
                                <FeatureCard icon={MessageSquare} title="Direct Messaging" description="Engage in private, one-to-one conversations with your friends and colleagues with rich media and file support." />
                                <FeatureCard icon={Phone} title="Voice & Video Calls" description="Hop into high-quality voice and video calls with your friends or within a server. (Currently in Beta)" />
                                <FeatureCard icon={Bot} title="Bots & Commands" description="Enhance your server with bots for moderation, polls, custom embeds, and other quality-of-life features." />
                            </div>
                        </FeatureSection>
                    </div>
                </section>
                
                 {/* Customization Section */}
                 <section className="py-20">
                    <div className="container mx-auto px-4">
                        <FeatureSection>
                           <div className="text-center">
                                <h3 className="text-3xl font-bold mb-4">Make It Yours</h3>
                                <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">From your profile to your entire app experience, Phunt gives you the tools to express yourself.</p>
                           </div>
                           <div className="grid md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <h4 className="text-2xl font-semibold mb-3">Total Profile Control</h4>
                                    <ul className="space-y-3 text-muted-foreground">
                                        <li className="flex items-start gap-3"><Palette className="size-5 mt-1 text-primary"/><span>Customize your profile with custom banners, colors, and animated effects.</span></li>
                                        <li className="flex items-start gap-3"><Gamepad2 className="size-5 mt-1 text-primary"/><span>Show off what game you're playing or what music you're listening to.</span></li>
                                        <li className="flex items-start gap-3"><LinkIcon className="size-5 mt-1 text-primary"/><span>Connect your Spotify, GitHub, and other accounts to display on your profile.</span></li>
                                    </ul>
                                </div>
                                <div className="p-4 bg-card rounded-xl border shadow-lg">
                                    <Image src="https://phuntapp.netlify.app/showcase.png" alt="Profile customization showcase" width={600} height={400} className="rounded-lg" />
                                </div>
                           </div>
                        </FeatureSection>
                    </div>
                </section>
                
                {/* Phunt Preview Section */}
                 <section className="py-20 bg-secondary/30">
                    <div className="container mx-auto px-4">
                         <FeatureSection>
                             <div className="text-center bg-card p-10 rounded-2xl border shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
                                <div className="relative z-10">
                                    <h3 className="text-4xl font-extrabold tracking-tight mb-4">Join Phunt Preview</h3>
                                    <p className="text-muted-foreground text-lg mb-8 max-w-3xl mx-auto">Get a sneak peek at new features before they're released to the public. As a Preview member, you'll get early access to updates and have a direct line to our development team to provide feedback.</p>
                                     <Link href="/preview">
                                        <Button size="lg" variant="secondary" className="text-lg">
                                            <Eye className="mr-2" />
                                            Join the Preview Program
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </FeatureSection>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4 text-center">
                         <FeatureSection>
                            <h3 className="text-4xl font-extrabold tracking-tight mb-4">Ready to Dive In?</h3>
                            <p className="text-muted-foreground text-lg mb-8">Join thousands of communities and start chatting today.</p>
                             <Link href="/login">
                                <Button size="lg" className="text-lg px-8 py-6">
                                    Get Started for Free
                                </Button>
                            </Link>
                        </FeatureSection>
                    </div>
                </section>

                <footer className="p-8 text-muted-foreground text-sm border-t">
                    <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p>&copy; {new Date().getFullYear()} PhuntLabs. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                             <Link href="/terms" className="hover:text-foreground">Terms of Use</Link>
                             <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
