import { Header } from "@/components/client/header";
import { Footer } from "@/components/client/footer";

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            {children}
            <Footer />
        </>
    );
}
