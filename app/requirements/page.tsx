"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RequirementsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/requirements");
  }, [router]);
  return null;
} 