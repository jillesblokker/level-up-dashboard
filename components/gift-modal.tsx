"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Coins, Gift, Send, Heart, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GiftModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recipientId: string;
    recipientName: string;
    userGold: number;
}

export function GiftModal({ open, onOpenChange, recipientId, recipientName, userGold }: GiftModalProps) {
    const [itemType, setItemType] = useState('gold');
    const [amount, setAmount] = useState(10);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (itemType === 'gold' && amount > userGold) {
            toast.error("Insufficient gold!");
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/gifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId,
                    itemType,
                    amount: parseInt(amount.toString()),
                    message
                })
            });

            if (res.ok) {
                toast.success(`Gift sent to ${recipientName}!`);
                onOpenChange(false);
                setMessage('');
                setAmount(10);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to send gift");
            }
        } catch (error) {
            toast.error("Failed to send gift");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-amber-950/90 via-zinc-950 to-zinc-950 border-amber-700/30 shadow-2xl shadow-amber-500/10 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/5 rounded-full blur-3xl" />
                </div>

                <DialogHeader className="relative z-10">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Gift className="w-5 h-5 text-amber-400" />
                        <DialogTitle className="text-xl font-serif text-amber-200">
                            Send a Gift
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-amber-300/60 text-sm italic text-center">
                        Strengthen your bond with {recipientName} through generosity
                    </DialogDescription>
                </DialogHeader>

                <div className="relative z-10 grid gap-5 py-4">
                    {/* Gift Type */}
                    <div className="grid gap-2">
                        <Label className="text-amber-200/80 text-sm">Gift Type</Label>
                        <Select value={itemType} onValueChange={setItemType}>
                            <SelectTrigger className="bg-zinc-900/80 border-amber-700/30 text-amber-100 focus:ring-amber-500/30">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-amber-700/30">
                                <SelectItem value="gold" className="text-amber-100 focus:bg-amber-900/30 focus:text-amber-50">
                                    <div className="flex items-center gap-2">
                                        <Coins className="w-4 h-4 text-amber-400" /> Gold Coins
                                    </div>
                                </SelectItem>
                                {/* Future: Add more types */}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Amount */}
                    {itemType === 'gold' && (
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-amber-200/80 text-sm">Amount</Label>
                                <span className="text-xs text-amber-400/60">Your Gold: {userGold}</span>
                            </div>
                            <div className="relative">
                                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                                <Input
                                    type="number"
                                    min="1"
                                    max={userGold}
                                    value={amount}
                                    onChange={(e) => setAmount(parseInt(e.target.value))}
                                    className="pl-10 bg-zinc-900/80 border-amber-700/30 text-amber-100 focus:ring-amber-500/30 focus:border-amber-500/50"
                                />
                            </div>
                        </div>
                    )}

                    {/* Message */}
                    <div className="grid gap-2">
                        <Label className="text-amber-200/80 text-sm flex items-center gap-2">
                            <Heart className="w-3 h-3 text-rose-400/60" />
                            Personal Message
                            <span className="text-amber-400/40 text-xs">(Optional)</span>
                        </Label>
                        <Textarea
                            placeholder="A token of our friendship..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="bg-zinc-900/80 border-amber-700/30 text-amber-100 placeholder:text-amber-300/30 focus:ring-amber-500/30 focus:border-amber-500/50 min-h-[80px]"
                        />
                    </div>
                </div>

                <DialogFooter className="relative z-10 flex flex-row gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-12 text-amber-200/60 hover:text-amber-100 hover:bg-amber-900/20 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={sending || amount <= 0 || amount > userGold}
                        className={cn(
                            "flex-1 h-12 bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20 gap-2 rounded-xl",
                            sending && "opacity-70"
                        )}
                    >
                        {sending ? (
                            <>
                                <Sparkles className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send Gift
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

