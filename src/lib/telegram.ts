/**
 * Telegram Bot utility for sending notifications
 * 
 * Setup:
 * 1. Create bot via @BotFather on Telegram
 * 2. Get bot token
 * 3. Start chat with bot and get chat ID
 * 4. Add to .env: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

interface TelegramConfig {
    botToken: string;
    chatId: string;
}

function getConfig(): TelegramConfig | null {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.warn("Telegram not configured: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
        return null;
    }

    return { botToken, chatId };
}

/**
 * Send a text message via Telegram
 */
export async function sendTelegramMessage(
    message: string,
    options?: { parseMode?: "HTML" | "Markdown" | "MarkdownV2" }
): Promise<boolean> {
    const config = getConfig();
    if (!config) return false;

    try {
        const response = await fetch(
            `${TELEGRAM_API}${config.botToken}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: config.chatId,
                    text: message,
                    parse_mode: options?.parseMode || "HTML",
                }),
            }
        );

        const result = await response.json();
        return result.ok === true;
    } catch (error) {
        console.error("Telegram send error:", error);
        return false;
    }
}

/**
 * Notify admin about new order
 */
export async function notifyNewOrder(order: {
    id: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    itemCount: number;
}): Promise<boolean> {
    const message = `
🛒 <b>ĐƠN HÀNG MỚI!</b>

📦 Mã đơn: <code>${order.id}</code>
👤 Khách: ${order.customerName}
📞 SĐT: ${order.customerPhone}
🛍️ Số SP: ${order.itemCount}
💰 Tổng: <b>${formatCurrency(order.totalAmount)}</b>

⏰ ${new Date().toLocaleString("vi-VN")}
`.trim();

    return sendTelegramMessage(message);
}

/**
 * Notify admin about server error
 */
export async function notifyServerError(error: {
    endpoint: string;
    method: string;
    statusCode: number;
    message: string;
    stack?: string;
}): Promise<boolean> {
    const message = `
🚨 <b>LỖI SERVER ${error.statusCode}</b>

📍 ${error.method} ${error.endpoint}
❌ ${error.message}

${error.stack ? `<pre>${error.stack.slice(0, 500)}</pre>` : ""}

⏰ ${new Date().toLocaleString("vi-VN")}
`.trim();

    return sendTelegramMessage(message);
}

/**
 * Notify admin about low stock
 */
export async function notifyLowStock(product: {
    name: string;
    sku: string;
    currentStock: number;
}): Promise<boolean> {
    const message = `
⚠️ <b>SẮP HẾT HÀNG</b>

📦 ${product.name}
🏷️ SKU: <code>${product.sku}</code>
📊 Còn lại: <b>${product.currentStock}</b>
`.trim();

    return sendTelegramMessage(message);
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
}
