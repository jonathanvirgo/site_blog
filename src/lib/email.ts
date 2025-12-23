import { Resend } from "resend";

// Lazy initialize Resend client to avoid build-time errors
let resendClient: Resend | null = null;

function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }
    if (!resendClient) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
}

// Default sender email (must be verified in Resend dashboard)
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
}

/**
 * Send email via Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<{
    success: boolean;
    id?: string;
    error?: string;
}> {
    const resend = getResend();
    if (!resend) {
        console.warn("Email not configured: missing RESEND_API_KEY");
        return { success: false, error: "Email not configured" };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: options.from || DEFAULT_FROM,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            replyTo: options.replyTo,
        });

        if (error) {
            console.error("Email send error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };
    } catch (error) {
        console.error("Email send error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(order: {
    id: string;
    customerEmail: string;
    customerName: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        image?: string;
    }>;
    subtotal: number;
    shippingFee: number;
    discount: number;
    totalAmount: number;
    shippingAddress: {
        fullName: string;
        phone: string;
        address: string;
        ward: string;
        district: string;
        city: string;
    };
    paymentMethod: string;
}): Promise<{ success: boolean; error?: string }> {
    const html = generateOrderEmailHTML(order);
    const text = generateOrderEmailText(order);

    return sendEmail({
        to: order.customerEmail,
        subject: `Xác nhận đơn hàng #${order.id.slice(-8).toUpperCase()}`,
        html,
        text,
    });
}

/**
 * Generate beautiful HTML email template
 */
function generateOrderEmailHTML(order: {
    id: string;
    customerName: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        image?: string;
    }>;
    subtotal: number;
    shippingFee: number;
    discount: number;
    totalAmount: number;
    shippingAddress: {
        fullName: string;
        phone: string;
        address: string;
        ward: string;
        district: string;
        city: string;
    };
    paymentMethod: string;
}): string {
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("vi-VN").format(amount) + "đ";

    const itemsHTML = order.items
        .map(
            (item) => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center;">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 12px;">` : ""}
                    <span style="font-weight: 500;">${item.name}</span>
                </div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>
    `
        )
        .join("");

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận đơn hàng</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Đặt hàng thành công!</h1>
            </td>
        </tr>
        
        <!-- Content -->
        <tr>
            <td style="padding: 32px;">
                <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
                    Xin chào <strong>${order.customerName}</strong>,
                </p>
                <p style="font-size: 16px; color: #666; margin-bottom: 24px;">
                    Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
                </p>
                
                <!-- Order Info -->
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #666;">
                        <strong>Mã đơn hàng:</strong> 
                        <span style="color: #667eea; font-weight: bold;">#${order.id.slice(-8).toUpperCase()}</span>
                    </p>
                </div>
                
                <!-- Items Table -->
                <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Chi tiết đơn hàng</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 12px; text-align: left;">Sản phẩm</th>
                            <th style="padding: 12px; text-align: center;">SL</th>
                            <th style="padding: 12px; text-align: right;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                
                <!-- Totals -->
                <table width="100%" style="margin-bottom: 24px;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Tạm tính:</td>
                        <td style="padding: 8px 0; text-align: right;">${formatCurrency(order.subtotal)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Phí vận chuyển:</td>
                        <td style="padding: 8px 0; text-align: right;">${formatCurrency(order.shippingFee)}</td>
                    </tr>
                    ${order.discount > 0 ? `
                    <tr>
                        <td style="padding: 8px 0; color: #22c55e;">Giảm giá:</td>
                        <td style="padding: 8px 0; text-align: right; color: #22c55e;">-${formatCurrency(order.discount)}</td>
                    </tr>
                    ` : ""}
                    <tr style="border-top: 2px solid #333;">
                        <td style="padding: 12px 0; font-size: 18px; font-weight: bold;">Tổng cộng:</td>
                        <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #667eea;">${formatCurrency(order.totalAmount)}</td>
                    </tr>
                </table>
                
                <!-- Shipping Address -->
                <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Địa chỉ giao hàng</h3>
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0;"><strong>${order.shippingAddress.fullName}</strong></p>
                    <p style="margin: 0 0 8px 0; color: #666;">${order.shippingAddress.phone}</p>
                    <p style="margin: 0; color: #666;">
                        ${order.shippingAddress.address}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.city}
                    </p>
                </div>
                
                <!-- Payment Method -->
                <div style="background-color: #fff3cd; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #856404;">
                        <strong>Phương thức thanh toán:</strong> ${order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" : order.paymentMethod}
                    </p>
                </div>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #f8f9fa; padding: 24px; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
                    Nếu có thắc mắc, vui lòng liên hệ với chúng tôi
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                    © ${new Date().getFullYear()} Your Store. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Generate plain text version for email clients that don't support HTML
 */
function generateOrderEmailText(order: {
    id: string;
    customerName: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    subtotal: number;
    shippingFee: number;
    discount: number;
    totalAmount: number;
    shippingAddress: {
        fullName: string;
        phone: string;
        address: string;
        ward: string;
        district: string;
        city: string;
    };
    paymentMethod: string;
}): string {
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("vi-VN").format(amount) + "đ";

    const itemsList = order.items
        .map((item) => `- ${item.name} x${item.quantity}: ${formatCurrency(item.price * item.quantity)}`)
        .join("\n");

    return `
ĐẶT HÀNG THÀNH CÔNG!

Xin chào ${order.customerName},

Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã được tiếp nhận.

Mã đơn hàng: #${order.id.slice(-8).toUpperCase()}

CHI TIẾT ĐƠN HÀNG:
${itemsList}

Tạm tính: ${formatCurrency(order.subtotal)}
Phí vận chuyển: ${formatCurrency(order.shippingFee)}
${order.discount > 0 ? `Giảm giá: -${formatCurrency(order.discount)}` : ""}
TỔNG CỘNG: ${formatCurrency(order.totalAmount)}

ĐỊA CHỈ GIAO HÀNG:
${order.shippingAddress.fullName}
${order.shippingAddress.phone}
${order.shippingAddress.address}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.city}

Phương thức thanh toán: ${order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" : order.paymentMethod}
    `.trim();
}

// ============================================
// DELETION NOTIFICATION EMAILS
// ============================================

interface DeletedItem {
    id: string;
    name: string;
    type: "article" | "product";
    slug?: string;
    image?: string;
    deletedBy?: string;
}

/**
 * Send deletion notification email to admin
 */
export async function sendDeletionNotificationEmail(data: {
    items: DeletedItem[];
    deletedBy: string;
    trashUrl: string;
}): Promise<{ success: boolean; error?: string }> {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

    if (!adminEmail) {
        console.warn("Admin email not configured: missing ADMIN_NOTIFICATION_EMAIL");
        return { success: false, error: "Admin email not configured" };
    }

    const html = generateDeletionEmailHTML(data);
    const text = generateDeletionEmailText(data);

    return sendEmail({
        to: adminEmail,
        subject: `⚠️ ${data.items.length} mục đã bị xóa - Cần xem xét`,
        html,
        text,
    });
}

/**
 * Generate deletion notification HTML email
 */
function generateDeletionEmailHTML(data: {
    items: DeletedItem[];
    deletedBy: string;
    trashUrl: string;
}): string {
    const formatDate = () => {
        return new Date().toLocaleString("vi-VN", {
            dateStyle: "full",
            timeStyle: "short",
        });
    };

    const getTypeLabel = (type: string) => {
        return type === "article" ? "Bài viết" : "Sản phẩm";
    };

    const getTypeIcon = (type: string) => {
        return type === "article" ? "📝" : "📦";
    };

    const itemsHTML = data.items
        .map(
            (item) => `
        <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${item.image
                    ? `<img src="${item.image}" alt="${item.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px;">`
                    : `<div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">${getTypeIcon(item.type)}</div>`
                }
                    <div>
                        <p style="margin: 0; font-weight: 600; color: #1f2937;">${item.name}</p>
                        <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">
                            <span style="background: ${item.type === "article" ? "#dbeafe" : "#fef3c7"}; color: ${item.type === "article" ? "#1d4ed8" : "#92400e"}; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                                ${getTypeLabel(item.type)}
                            </span>
                        </p>
                    </div>
                </div>
            </td>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 11px; color: #6b7280;">
                    ${item.id.slice(-8)}
                </code>
            </td>
        </tr>
    `
        )
        .join("");

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thông báo xóa</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 8px;">🗑️</div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Thông báo xóa nội dung</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">
                    ${data.items.length} mục đã được chuyển vào thùng rác
                </p>
            </td>
        </tr>
        
        <!-- Info Box -->
        <tr>
            <td style="padding: 24px 32px 0;">
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 16px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>👤 Người thực hiện:</strong> ${data.deletedBy}<br>
                        <strong>🕐 Thời gian:</strong> ${formatDate()}
                    </p>
                </div>
            </td>
        </tr>
        
        <!-- Items Table -->
        <tr>
            <td style="padding: 24px 32px;">
                <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 16px; font-weight: 600;">
                    📋 Danh sách đã xóa
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background-color: #f9fafb;">
                            <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Nội dung</th>
                            <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
            </td>
        </tr>
        
        <!-- Action Button -->
        <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px;">
                    Bạn có thể khôi phục các mục đã xóa từ thùng rác trong vòng 30 ngày.
                </p>
                <a href="${data.trashUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
                    🔄 Xem thùng rác
                </a>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Email tự động từ hệ thống quản trị.<br>
                    © ${new Date().getFullYear()} Admin Dashboard
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Generate deletion notification plain text email
 */
function generateDeletionEmailText(data: {
    items: DeletedItem[];
    deletedBy: string;
    trashUrl: string;
}): string {
    const formatDate = () => {
        return new Date().toLocaleString("vi-VN", {
            dateStyle: "full",
            timeStyle: "short",
        });
    };

    const itemsList = data.items
        .map((item) => `- [${item.type === "article" ? "Bài viết" : "Sản phẩm"}] ${item.name} (ID: ${item.id.slice(-8)})`)
        .join("\n");

    return `
⚠️ THÔNG BÁO XÓA NỘI DUNG

${data.items.length} mục đã được chuyển vào thùng rác.

👤 Người thực hiện: ${data.deletedBy}
🕐 Thời gian: ${formatDate()}

📋 DANH SÁCH ĐÃ XÓA:
${itemsList}

Bạn có thể khôi phục các mục đã xóa từ thùng rác trong vòng 30 ngày.

🔄 Xem thùng rác: ${data.trashUrl}

---
Email tự động từ hệ thống quản trị.
    `.trim();
}

// ============================================
// TEST EMAIL
// ============================================

/**
 * Send a test email to verify configuration
 */
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
        <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                <div style="font-size: 56px; margin-bottom: 12px;">✅</div>
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Cấu hình thành công!</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px; text-align: center;">
                <p style="font-size: 16px; color: #4b5563; margin: 0 0 24px; line-height: 1.6;">
                    Hệ thống gửi email <strong style="color: #10b981;">Resend</strong> đã được cấu hình đúng và hoạt động bình thường.
                </p>
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; border: 1px solid #bbf7d0;">
                    <p style="margin: 0; color: #166534; font-size: 14px;">
                        <strong>📧 Gửi tới:</strong> ${to}<br>
                        <strong>🕐 Thời gian:</strong> ${new Date().toLocaleString("vi-VN")}
                    </p>
                </div>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Email test từ Admin Dashboard
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();

    return sendEmail({
        to,
        subject: "✅ Test Email - Cấu hình Resend thành công",
        html,
        text: `Cấu hình Resend thành công!\n\nHệ thống gửi email đã được cấu hình đúng.\nGửi tới: ${to}\nThời gian: ${new Date().toLocaleString("vi-VN")}`,
    });
}

/**
 * Check if Resend is configured
 */
export function isEmailConfigured(): boolean {
    return !!process.env.RESEND_API_KEY;
}

/**
 * Get current email configuration status
 */
export function getEmailConfigStatus(): {
    configured: boolean;
    fromEmail: string;
    adminEmail: string | null;
} {
    return {
        configured: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || null,
    };
}
