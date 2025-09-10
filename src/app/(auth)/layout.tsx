
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


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      <Starfield />
      <div className="relative z-10 w-full max-w-md p-4">
        {children}
      </div>
    </div>
  );
}
