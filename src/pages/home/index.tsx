import HomeNavbar from "./components/HomeNavbar";
import HeroSection from "./components/HeroSection";
import FeaturesStrip from "./components/FeaturesStrip";
import HomeSecuritySection from "./components/HomeSecuritySection";
import HomePricingSection from "./components/HomePricingSection";
import HomeFAQSection from "./components/HomeFAQSection";
import HomeFooter from "./components/HomeFooter";

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 selection:bg-purple-500/20 selection:text-purple-600 dark:selection:text-purple-300">
            {/* Top Navigation Bar */}
            <HomeNavbar />

            {/* Main Content Area */}
            <main className="flex-1">
                {/* Hero Section with Overlapping Mockups */}
                <HeroSection />

                {/* 4-Pillar Frosted Glass Feature Strip */}
                <div id="features">
                    <FeaturesStrip />
                </div>

                {/* End-to-End Encryption & Security Architecture */}
                <HomeSecuritySection />

                {/* Pricing & Membership Plans (Code preserved for future release, disabled for now) */}
                {false && <HomePricingSection />}

                {/* Interactive FAQ Section */}
                <HomeFAQSection />
            </main>

            {/* Site Footer */}
            <HomeFooter />
        </div>
    );
}
