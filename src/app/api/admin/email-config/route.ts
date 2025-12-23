import { NextRequest, NextResponse } from "next/server";
import { sendTestEmail, getEmailConfigStatus } from "@/lib/email";

// GET /api/admin/email-config - Get email configuration status
export async function GET() {
    try {
        const config = getEmailConfigStatus();
        return NextResponse.json(config);
    } catch (error) {
        console.error("Get email config error:", error);
        return NextResponse.json(
            { error: "Failed to get email config" },
            { status: 500 }
        );
    }
}

// POST /api/admin/email-config - Send test email
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const result = await sendTestEmail(email);

        if (result.success) {
            return NextResponse.json({
                message: "Test email sent successfully",
            });
        } else {
            return NextResponse.json(
                { error: result.error || "Failed to send test email" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Send test email error:", error);
        return NextResponse.json(
            { error: "Failed to send test email" },
            { status: 500 }
        );
    }
}
