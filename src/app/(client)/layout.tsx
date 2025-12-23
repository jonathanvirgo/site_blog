import { Header } from "@/components/client/header";
import { Footer } from "@/components/client/footer";
import { CartProvider } from "@/context/cart-context";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CartProvider>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
            </div>
        </CartProvider>
    );
}
