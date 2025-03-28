"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load display name
        const savedName = localStorage.getItem("display-name");
        if (savedName) {
          setDisplayName(savedName);
        }

        // Load email
        const savedEmail = localStorage.getItem("user-email");
        if (savedEmail) {
          setEmail(savedEmail);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    
    try {
      const newName = nameInput.value.trim();
      const newEmail = emailInput.value.trim();

      if (newName) {
        localStorage.setItem("display-name", newName);
        setDisplayName(newName);
      }

      if (newEmail) {
        localStorage.setItem("user-email", newEmail);
        setEmail(newEmail);
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update your profile",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container max-w-4xl py-12">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-white animate-pulse">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container max-w-4xl py-6">
        <div className="mb-6">
          <Link href="/kingdom">
            <Button variant="outline" size="sm" className="text-white border-amber-800/20 hover:bg-amber-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Kingdom
            </Button>
          </Link>
        </div>

        <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-white">Profile Settings</CardTitle>
            <CardDescription className="text-gray-400">Update your display name and email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Display Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={displayName}
                  placeholder="Enter your display name"
                  className="bg-gray-900 border-amber-800/20 text-white"
                />
                <p className="text-xs text-gray-400">
                  This name will appear in the welcome message
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={email}
                  placeholder="Enter your email address"
                  className="bg-gray-900 border-amber-800/20 text-white"
                />
                <p className="text-xs text-gray-400">
                  Your email address for account management
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 