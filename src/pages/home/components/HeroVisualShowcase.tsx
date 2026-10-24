import React from "react";
import PhoneMockup from "./PhoneMockup";
import LaptopMockup from "./LaptopMockup";

export const HeroVisualShowcase: React.FC = () => {
    return (
        <div className="relative w-full max-w-[850px] mx-auto select-none py-6 lg:py-0">
            {/* Ambient Background Glow behind devices */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-blue-500/15 blur-3xl -z-10 pointer-events-none"
                aria-hidden="true"
            />

            {/* Container for Overlapping Devices */}
            <div className="relative flex items-center justify-center">
                {/* 1. Desktop Laptop Mockup (Background / Right) */}
                <div className="w-full hidden sm:block lg:pl-16 transition-transform duration-500 hover:scale-[1.01]">
                    <LaptopMockup className="w-full h-[460px] sm:h-[490px] lg:h-[510px]" />
                </div>

                {/* 2. Mobile Phone Mockup (Foreground / Overlapping Left) */}
                <div
                    className="sm:absolute sm:-left-4 sm:-bottom-6 lg:-left-6 lg:-bottom-8 z-20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
                >
                    <PhoneMockup className="scale-95 sm:scale-100 origin-bottom" />
                </div>
            </div>
        </div>
    );
};

export default HeroVisualShowcase;
