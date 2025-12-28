import { AllianceDashboard } from "@/components/alliance-dashboard";
import { Leaderboard } from "@/components/leaderboard";
import { HeaderSection } from "@/components/HeaderSection";
import { Suspense } from "react";

export default function SocialPage() {
    return (
        <main className="min-h-screen bg-black pb-20">
            <HeaderSection
                title="Social Hub"
                subtitle="Forge alliances and strengthen bonds with fellow adventurers."
                imageSrc="/images/locations/tavern.jpg"
                defaultBgColor="bg-amber-950"
            />

            <div className="container mx-auto px-4 -mt-20 relative z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {/* Alliances Column */}
                <div className="md:col-span-1 space-y-6">
                    <h2 className="text-2xl font-medieval text-amber-500 mb-4 px-2">Your Alliances</h2>
                    <Suspense fallback={<div>Loading Alliances...</div>}>
                        <AllianceDashboard />
                    </Suspense>
                </div>

                {/* Future columns for Friend Activity, Leaderboards, etc. */}
                <div className="md:col-span-1 lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-medieval text-amber-500 mb-4 px-2">Legends of the Realm</h2>
                    <Suspense fallback={<div>Loading Leaderboard...</div>}>
                        <Leaderboard />
                    </Suspense>
                </div>

            </div>
        </main>
    );
}
