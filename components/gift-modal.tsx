import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Coins, Gift, Send } from 'lucide-react';
import { toast } from 'sonner';

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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-primary" />
                        Send Gift to {recipientName}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Gift Type</Label>
                        <Select value={itemType} onValueChange={setItemType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gold">
                                    <div className="flex items-center gap-2">
                                        <Coins className="w-4 h-4 text-amber-500" /> Gold Coins
                                    </div>
                                </SelectItem>
                                {/* Future: Add more types */}
                            </SelectContent>
                        </Select>
                    </div>

                    {itemType === 'gold' && (
                        <div className="grid gap-2">
                            <Label>Amount (Max: {userGold})</Label>
                            <Input
                                type="number"
                                min="1"
                                max={userGold}
                                value={amount}
                                onChange={(e) => setAmount(parseInt(e.target.value))}
                            />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label>Message (Optional)</Label>
                        <Textarea
                            placeholder="A small token of our alliance..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSend} disabled={sending}>
                        {sending ? "Sending..." : (
                            <>
                                <Send className="w-4 h-4 mr-2" /> Send Gift
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
