"use client";

import { useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/context/cart-context";

interface CartMergeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    guestItemCount: number;
    onMerge: () => Promise<void>;
    onDiscard: () => Promise<void>;
}

export function CartMergeDialog({
    isOpen,
    onClose,
    guestItemCount,
    onMerge,
    onDiscard,
}: CartMergeDialogProps) {
    const [loading, setLoading] = useState(false);
    const [dontAskAgain, setDontAskAgain] = useState(false);
    const { refreshCart } = useCart();

    const handleMerge = async () => {
        setLoading(true);
        try {
            await onMerge();
            if (dontAskAgain) {
                localStorage.setItem("dontAskCartMerge", "true");
            }
            await refreshCart();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleDiscard = async () => {
        setLoading(true);
        try {
            await onDiscard();
            if (dontAskAgain) {
                localStorage.setItem("dontAskCartMerge", "true");
            }
            await refreshCart();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Bạn có sản phẩm trong giỏ</DialogTitle>
                            <DialogDescription>
                                Giỏ hàng khách của bạn có {guestItemCount} sản phẩm.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-muted-foreground">
                        Bạn muốn thêm chúng vào giỏ hàng tài khoản không?
                    </p>
                </div>

                <div className="flex items-center space-x-2 pb-4">
                    <Checkbox
                        id="dontAsk"
                        checked={dontAskAgain}
                        onCheckedChange={(checked) => setDontAskAgain(checked as boolean)}
                    />
                    <label
                        htmlFor="dontAsk"
                        className="text-sm text-muted-foreground cursor-pointer"
                    >
                        Không hỏi lại lần sau
                    </label>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleDiscard}
                        disabled={loading}
                    >
                        Bỏ qua
                    </Button>
                    <Button onClick={handleMerge} disabled={loading}>
                        {loading ? "Đang xử lý..." : "Gộp giỏ hàng ✓"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
