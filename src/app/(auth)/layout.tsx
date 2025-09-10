
'use client';

import { useState, useEffect } from 'react';

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

const Orbits = () => (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[800px] h-[800px] absolute rounded-full border border-white/10 animate-spin-slow"/>
        <div className="w-[600px] h-[600px] absolute rounded-full border border-white/5 animate-spin-slow-reverse"/>
        <div className="w-[400px] h-[400px] absolute rounded-full border border-white/10 animate-spin-slow"/>
    </div>
)


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
      <Starfield />
      <Orbits />
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}

