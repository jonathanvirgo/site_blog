import { z } from "zod";

// Auth schemas
export const registerSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z
        .string()
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
        .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
        .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 số"),
    fullName: z.string().min(2, "Tên phải có ít nhất 2 ký tự").optional(),
    phone: z
        .string()
        .regex(/^(0[3|5|7|8|9])[0-9]{8}$/, "Số điện thoại không hợp lệ")
        .optional(),
});

export const loginSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});

// Article schemas
export const articleSchema = z.object({
    title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự"),
    slug: z.string().optional(),
    excerpt: z.string().optional(),
    content: z.string().min(100, "Nội dung phải có ít nhất 100 ký tự"),
    featuredImage: z.string().url().optional(),
    categoryId: z.string().uuid().optional(),
    status: z.enum(["draft", "published", "archived"]).default("draft"),
    isFeatured: z.boolean().default(false),
    isNotable: z.boolean().default(false),
    tagIds: z.array(z.string().uuid()).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
});

// Product schemas
export const productSchema = z.object({
    name: z.string().min(3, "Tên sản phẩm phải có ít nhất 3 ký tự"),
    slug: z.string().optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    images: z.array(z.string().url()).default([]),
    categoryId: z.string().uuid().optional(),
    status: z.enum(["draft", "active", "inactive"]).default("draft"),
    isFeatured: z.boolean().default(false),
    hasVariants: z.boolean().default(false),
    tagIds: z.array(z.string().uuid()).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
});

export const productVariantSchema = z.object({
    sku: z.string().min(1, "SKU là bắt buộc"),
    price: z.number().positive("Giá phải lớn hơn 0"),
    salePrice: z.number().positive().optional(),
    stockQuantity: z.number().int().min(0).default(0),
    isDefault: z.boolean().default(false),
    attributeValueIds: z.array(z.string().uuid()).optional(),
});

// Order schemas
export const createOrderSchema = z.object({
    shippingName: z.string().min(2, "Tên người nhận là bắt buộc"),
    shippingPhone: z
        .string()
        .regex(/^(0[3|5|7|8|9])[0-9]{8}$/, "Số điện thoại không hợp lệ"),
    shippingAddress: z.string().min(10, "Địa chỉ phải có ít nhất 10 ký tự"),
    cityId: z.string().uuid("Vui lòng chọn tỉnh/thành phố"),
    districtId: z.string().uuid("Vui lòng chọn quận/huyện"),
    wardId: z.string().uuid("Vui lòng chọn phường/xã"),
    paymentMethod: z.enum(["cod", "vnpay", "momo", "zalopay"]),
    couponCode: z.string().optional(),
    note: z.string().optional(),
});

// Cart schemas
export const addToCartSchema = z.object({
    variantId: z.string().uuid("Variant ID không hợp lệ"),
    quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
    quantity: z.number().int().min(0),
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ArticleInput = z.infer<typeof articleSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
