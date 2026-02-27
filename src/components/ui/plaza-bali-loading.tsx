"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface PlazaBaliLoadingProps {
    className?: string;
    fullScreen?: boolean;
}

export function PlazaBaliLoading({ className, fullScreen = true }: PlazaBaliLoadingProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center bg-background/95 backdrop-blur-md transition-all duration-500",
                fullScreen ? "fixed inset-0 z-[100]" : "w-full h-64",
                className
            )}
        >
            <div className="relative flex items-center justify-center mb-4">
                {/* Pulsing Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-primary/20 animate-[pulse-ring_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/10 animate-[pulse-ring_2s_cubic-bezier(0,0,0.2,1)_infinite_200ms]" />

                {/* Logo Container */}
                <div className="relative z-10 p-6 bg-card rounded-2xl shadow-2xl border border-primary/20 bg-gradient-to-b from-card to-secondary/10 flex items-center justify-center overflow-hidden animate-[float_3s_ease-in-out_infinite]">
                    {/* Shimmer effect overlay */}
                    <div className="absolute inset-0 -skew-x-12 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20 pointer-events-none" />

                    <Image
                        src="/logo/login-logo.png"
                        alt="Plaza Bali Logo"
                        width={140}
                        height={60}
                        className="object-contain drop-shadow-lg"
                        priority
                    />
                </div>
            </div>

            {/* Loading Text */}
            <div className="mt-8 flex flex-col items-center gap-3">
                <h3 className="text-2xl font-bold tracking-widest bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-pulse">
                    PLAZA BALI
                </h3>
                <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
                </div>
            </div>
        </div>
    );
}
