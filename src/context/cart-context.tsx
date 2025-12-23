"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface CartContextType {
    itemCount: number;
    isLoading: boolean;
    addToCart: (variantId: string, quantity?: number) => Promise<boolean>;
    removeFromCart: (itemId: string) => void;
    refreshCart: () => Promise<void>;
    setItemCount: (count: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [itemCount, setItemCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Load cart count on mount
    useEffect(() => {
        // First, try localStorage for instant display
        const cached = localStorage.getItem("cartCount");
        if (cached) {
            setItemCount(parseInt(cached, 10) || 0);
        }

        // Then sync with server
        refreshCart();
    }, []);

    const refreshCart = useCallback(async () => {
        try {
            const res = await fetch("/api/cart/count");
            if (res.ok) {
                const data = await res.json();
                const count = data.count || 0;
                setItemCount(count);
                localStorage.setItem("cartCount", String(count));
            }
        } catch (error) {
            console.error("Failed to fetch cart count:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addToCart = useCallback(async (variantId: string, quantity: number = 1): Promise<boolean> => {
        // Optimistic update
        const previousCount = itemCount;
        setItemCount(prev => prev + quantity);
        localStorage.setItem("cartCount", String(itemCount + quantity));

        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ variantId, quantity }),
            });

            if (res.ok) {
                const data = await res.json();
                // Sync with server count
                if (typeof data.itemCount === "number") {
                    setItemCount(data.itemCount);
                    localStorage.setItem("cartCount", String(data.itemCount));
                }
                return true;
            } else {
                // Rollback on error
                setItemCount(previousCount);
                localStorage.setItem("cartCount", String(previousCount));
                return false;
            }
        } catch (error) {
            console.error("Add to cart error:", error);
            // Rollback on error
            setItemCount(previousCount);
            localStorage.setItem("cartCount", String(previousCount));
            return false;
        }
    }, [itemCount]);

    const removeFromCart = useCallback((itemId: string) => {
        // Optimistic update
        setItemCount(prev => Math.max(0, prev - 1));
        localStorage.setItem("cartCount", String(Math.max(0, itemCount - 1)));
    }, [itemCount]);

    return (
        <CartContext.Provider value={{
            itemCount,
            isLoading,
            addToCart,
            removeFromCart,
            refreshCart,
            setItemCount,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
}
