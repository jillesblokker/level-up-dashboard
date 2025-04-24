"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface UserProfileProps {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  isAdmin?: boolean;
}

export function UserProfile({ userId, userName, userEmail, userImage, isAdmin }: UserProfileProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [nextLevelXp, setNextLevelXp] = useState(100);

  useEffect(() => {
    async function fetchUserStats() {
      try {
        // In a real app, fetch user stats from API
        // For now, using mock data
        setLevel(1);
        setExperience(0);
        setNextLevelXp(100);
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      }
    }

    fetchUserStats();
  }, [userId]);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
        variant: "default",
      });
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md bg-black border-amber-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-amber-500">
            <AvatarImage src={userImage || ""} alt={userName || "User"} />
            <AvatarFallback className="bg-amber-950 text-amber-500">
              {userName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-amber-500">{userName || "Adventurer"}</span>
            {isAdmin && (
              <span className="text-xs text-amber-700 font-medium">Admin</span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-400">Email</p>
          <p className="text-gray-300">{userEmail || "No email provided"}</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Level</p>
            <p className="text-amber-500 font-bold">{level}</p>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-600 to-amber-500" 
              style={{ width: `${(experience / nextLevelXp) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">
            {experience} / {nextLevelXp} XP
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full border-amber-800 text-amber-500 hover:bg-amber-950"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  );
} 