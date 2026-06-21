"use client";
import { defaultInventoryItems } from "@/app/lib/default-inventory";
export default function TestDefaults() { return <div>Defaults length: {defaultInventoryItems ? defaultInventoryItems.length : 'UNDEFINED'}</div>;
}
