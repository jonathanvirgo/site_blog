import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting database seeding...\n");

    // 1. Create Article Categories
    console.log("📁 Creating article categories...");
    const articleCategories = await Promise.all([
        prisma.articleCategory.upsert({
            where: { slug: "suc-khoe" },
            update: {},
            create: { name: "Sức khỏe", slug: "suc-khoe", description: "Tin tức và bài viết về sức khỏe", sortOrder: 1 },
        }),
        prisma.articleCategory.upsert({
            where: { slug: "dinh-duong" },
            update: {},
            create: { name: "Dinh dưỡng", slug: "dinh-duong", description: "Kiến thức về dinh dưỡng", sortOrder: 2 },
        }),
        prisma.articleCategory.upsert({
            where: { slug: "lam-dep" },
            update: {},
            create: { name: "Làm đẹp", slug: "lam-dep", description: "Bí quyết làm đẹp", sortOrder: 3 },
        }),
        prisma.articleCategory.upsert({
            where: { slug: "me-va-be" },
            update: {},
            create: { name: "Mẹ & Bé", slug: "me-va-be", description: "Chăm sóc mẹ và bé", sortOrder: 4 },
        }),
    ]);
    console.log(`✅ Created ${articleCategories.length} article categories\n`);

    // 2. Create Product Categories
    console.log("📁 Creating product categories...");
    const productCategories = await Promise.all([
        prisma.productCategory.upsert({
            where: { slug: "vitamin" },
            update: {},
            create: { name: "Vitamin & Khoáng chất", slug: "vitamin", description: "Các loại vitamin và khoáng chất", sortOrder: 1 },
        }),
        prisma.productCategory.upsert({
            where: { slug: "thuc-pham-chuc-nang" },
            update: {},
            create: { name: "Thực phẩm chức năng", slug: "thuc-pham-chuc-nang", description: "Thực phẩm bổ sung sức khỏe", sortOrder: 2 },
        }),
        prisma.productCategory.upsert({
            where: { slug: "lam-dep" },
            update: {},
            create: { name: "Làm đẹp", slug: "lam-dep", description: "Sản phẩm làm đẹp", sortOrder: 3 },
        }),
        prisma.productCategory.upsert({
            where: { slug: "cham-soc-ca-nhan" },
            update: {},
            create: { name: "Chăm sóc cá nhân", slug: "cham-soc-ca-nhan", description: "Sản phẩm chăm sóc cá nhân", sortOrder: 4 },
        }),
    ]);
    console.log(`✅ Created ${productCategories.length} product categories\n`);

    // 3. Create Tags
    console.log("🏷️ Creating tags...");
    const tags = await Promise.all([
        prisma.tag.upsert({ where: { slug: "vitamin-c" }, update: {}, create: { name: "Vitamin C", slug: "vitamin-c", type: "both" } }),
        prisma.tag.upsert({ where: { slug: "omega-3" }, update: {}, create: { name: "Omega 3", slug: "omega-3", type: "both" } }),
        prisma.tag.upsert({ where: { slug: "giam-can" }, update: {}, create: { name: "Giảm cân", slug: "giam-can", type: "both" } }),
        prisma.tag.upsert({ where: { slug: "tang-cuong-mien-dich" }, update: {}, create: { name: "Tăng cường miễn dịch", slug: "tang-cuong-mien-dich", type: "both" } }),
        prisma.tag.upsert({ where: { slug: "tim-mach" }, update: {}, create: { name: "Tim mạch", slug: "tim-mach", type: "article" } }),
        prisma.tag.upsert({ where: { slug: "da-dep" }, update: {}, create: { name: "Da đẹp", slug: "da-dep", type: "both" } }),
    ]);
    console.log(`✅ Created ${tags.length} tags\n`);

    // 4. Create Admin User
    console.log("👤 Creating admin user...");
    const admin = await prisma.user.upsert({
        where: { email: "admin@healthnews.vn" },
        update: {},
        create: {
            email: "admin@healthnews.vn",
            phone: "0901234567",
            passwordHash: "$2a$10$dummy.hash.for.seeding", // bcrypt hash of "password123"
            fullName: "Admin User",
            role: "admin",
        },
    });
    console.log(`✅ Created admin user: ${admin.email}\n`);

    // 5. Create Products (30 for testing)
    console.log("📦 Creating products...");
    const productNames = [
        { name: "Vitamin C 1000mg Natural Plus", categoryIdx: 0, isFeatured: true },
        { name: "Omega 3 Fish Oil Premium", categoryIdx: 0, isFeatured: true },
        { name: "Calcium + Vitamin D3", categoryIdx: 0, isFeatured: true },
        { name: "Collagen Peptide 5000mg", categoryIdx: 2, isFeatured: true },
        { name: "Zinc 50mg Premium", categoryIdx: 0, isFeatured: true },
        { name: "Vitamin E 400IU", categoryIdx: 0, isFeatured: true },
        { name: "B-Complex Premium", categoryIdx: 0, isFeatured: true },
        { name: "Probiotics 10 Billion CFU", categoryIdx: 1, isFeatured: true },
        { name: "Iron Plus Folic Acid", categoryIdx: 0, isFeatured: true },
        { name: "Glucosamine 1500mg", categoryIdx: 1, isFeatured: true },
        { name: "Vitamin A 10000IU", categoryIdx: 0, isFeatured: false },
        { name: "Magnesium Citrate 400mg", categoryIdx: 0, isFeatured: false },
        { name: "Lutein 20mg Eye Support", categoryIdx: 1, isFeatured: false },
        { name: "CoQ10 100mg", categoryIdx: 1, isFeatured: false },
        { name: "Biotin 5000mcg", categoryIdx: 2, isFeatured: false },
        { name: "Vitamin K2 + D3", categoryIdx: 0, isFeatured: false },
        { name: "Spirulina 500mg", categoryIdx: 1, isFeatured: false },
        { name: "Turmeric Curcumin", categoryIdx: 1, isFeatured: false },
        { name: "Ginkgo Biloba Extract", categoryIdx: 1, isFeatured: false },
        { name: "Melatonin 5mg", categoryIdx: 1, isFeatured: false },
        { name: "L-Theanine 200mg", categoryIdx: 1, isFeatured: false },
        { name: "Selenium 200mcg", categoryIdx: 0, isFeatured: false },
        { name: "Hyaluronic Acid 100mg", categoryIdx: 2, isFeatured: false },
        { name: "Elderberry Extract", categoryIdx: 1, isFeatured: false },
        { name: "Ashwagandha 600mg", categoryIdx: 1, isFeatured: false },
        { name: "Prenatal Vitamins", categoryIdx: 0, isFeatured: false },
        { name: "Kids Multivitamin Gummies", categoryIdx: 0, isFeatured: false },
        { name: "Senior Multivitamin 50+", categoryIdx: 0, isFeatured: false },
        { name: "Whey Protein Isolate", categoryIdx: 1, isFeatured: false },
        { name: "Digestive Enzymes", categoryIdx: 1, isFeatured: false },
    ];

    for (let i = 0; i < productNames.length; i++) {
        const p = productNames[i];
        const slug = p.name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, "-");

        const product = await prisma.product.upsert({
            where: { slug },
            update: {},
            create: {
                name: p.name,
                slug,
                description: `${p.name} - Sản phẩm chất lượng cao, an toàn cho sức khỏe. Được chuyên gia khuyên dùng.`,
                shortDescription: `Sản phẩm ${p.name}`,
                categoryId: productCategories[p.categoryIdx].id,
                status: "active",
                isFeatured: p.isFeatured,
                hasVariants: i % 2 === 0,
                images: JSON.stringify([`/products/${slug}.jpg`]),
            },
        });

        // Create default variant
        await prisma.productVariant.upsert({
            where: { sku: slug + "-default" },
            update: {},
            create: {
                productId: product.id,
                sku: slug + "-default",
                price: Math.floor(Math.random() * 400000) + 100000,
                salePrice: Math.random() > 0.6 ? Math.floor(Math.random() * 200000) + 80000 : null,
                stockQuantity: Math.floor(Math.random() * 200) + 10,
                isDefault: true,
            },
        });
    }
    console.log(`✅ Created ${productNames.length} products with variants\n`);

    // 6. Create Articles (30+ for testing pagination)
    console.log("📰 Creating articles...");
    const articleTitles = [
        { title: "10 loại vitamin cần thiết cho sức khỏe mùa đông", categoryIdx: 1, isFeatured: true },
        { title: "Bí quyết ngủ ngon mỗi đêm từ các chuyên gia", categoryIdx: 0, isFeatured: true },
        { title: "Omega-3 và những lợi ích bất ngờ cho não bộ", categoryIdx: 1, isFeatured: true },
        { title: "Chăm sóc da mùa hanh khô hiệu quả", categoryIdx: 2, isFeatured: true },
        { title: "Dinh dưỡng cho bé phát triển toàn diện", categoryIdx: 3, isFeatured: true },
        { title: "Cách tăng cường hệ miễn dịch tự nhiên", categoryIdx: 0, isFeatured: true },
        { title: "Những thực phẩm giàu protein tốt nhất", categoryIdx: 1, isFeatured: true },
        { title: "Bài tập yoga cho người mới bắt đầu", categoryIdx: 0, isFeatured: true },
        { title: "Vitamin D và sức khỏe xương khớp", categoryIdx: 1, isFeatured: true },
        { title: "Chế độ ăn Low-Carb có thực sự hiệu quả?", categoryIdx: 1, isFeatured: true },
        { title: "5 cách giảm stress hiệu quả tại nhà", categoryIdx: 0, isFeatured: true },
        { title: "Lợi ích của thiền định cho sức khỏe tinh thần", categoryIdx: 0, isFeatured: true },
        { title: "Cách chọn kem chống nắng phù hợp", categoryIdx: 2, isFeatured: false },
        { title: "Tầm quan trọng của giấc ngủ sâu", categoryIdx: 0, isFeatured: false },
        { title: "Các loại trà thảo mộc tốt cho sức khỏe", categoryIdx: 1, isFeatured: false },
        { title: "Bí quyết làm đẹp từ thiên nhiên", categoryIdx: 2, isFeatured: false },
        { title: "Những thói quen xấu ảnh hưởng đến sức khỏe", categoryIdx: 0, isFeatured: false },
        { title: "Cách nấu ăn healthy cho gia đình", categoryIdx: 1, isFeatured: false },
        { title: "Lợi ích của việc đi bộ mỗi ngày", categoryIdx: 0, isFeatured: false },
        { title: "Chăm sóc răng miệng đúng cách", categoryIdx: 0, isFeatured: false },
        { title: "Cách phòng tránh cảm cúm mùa đông", categoryIdx: 0, isFeatured: false },
        { title: "Thực phẩm giúp tăng cường trí nhớ", categoryIdx: 1, isFeatured: false },
        { title: "Bí quyết giữ dáng sau sinh", categoryIdx: 3, isFeatured: false },
        { title: "Vitamin C và hệ miễn dịch", categoryIdx: 1, isFeatured: false },
        { title: "Cách chăm sóc tóc hư tổn", categoryIdx: 2, isFeatured: false },
        { title: "Thực phẩm tốt cho tim mạch", categoryIdx: 0, isFeatured: false },
        { title: "Lợi ích của nước ép rau xanh", categoryIdx: 1, isFeatured: false },
        { title: "Cách giảm mỡ bụng hiệu quả", categoryIdx: 0, isFeatured: false },
        { title: "Những loại hạt dinh dưỡng nhất", categoryIdx: 1, isFeatured: false },
        { title: "Chăm sóc sức khỏe cho người cao tuổi", categoryIdx: 0, isFeatured: false },
        { title: "Thực phẩm chống oxy hóa tự nhiên", categoryIdx: 1, isFeatured: false },
        { title: "Cách xây dựng thói quen ăn uống lành mạnh", categoryIdx: 1, isFeatured: false },
        { title: "Bí quyết có làn da trẻ trung", categoryIdx: 2, isFeatured: false },
        { title: "Những điều cần biết về probiotics", categoryIdx: 1, isFeatured: false },
        { title: "Lợi ích của việc tập thể dục buổi sáng", categoryIdx: 0, isFeatured: false },
    ];

    for (let i = 0; i < articleTitles.length; i++) {
        const a = articleTitles[i];
        const slug = a.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, "-")
            .substring(0, 60);

        await prisma.article.upsert({
            where: { slug },
            update: {},
            create: {
                title: a.title,
                slug,
                excerpt: `${a.title}. Đây là bài viết hữu ích về sức khỏe và lối sống lành mạnh...`,
                content: `<p>${a.title}</p><p>Nội dung chi tiết của bài viết...</p>`,
                categoryId: articleCategories[a.categoryIdx].id,
                authorId: admin.id,
                status: "published",
                isFeatured: a.isFeatured,
                viewCount: Math.floor(Math.random() * 3000) + 100,
                publishedAt: new Date(Date.now() - i * 3600 * 1000 * 4), // Stagger publish times
            },
        });
    }
    console.log(`✅ Created ${articleTitles.length} articles\n`);

    // 7. Create Cities
    console.log("🌍 Creating locations...");
    const cities = await Promise.all([
        prisma.city.upsert({
            where: { code: "HCM" },
            update: {},
            create: { name: "TP. Hồ Chí Minh", code: "HCM", sortOrder: 1 },
        }),
        prisma.city.upsert({
            where: { code: "HN" },
            update: {},
            create: { name: "Hà Nội", code: "HN", sortOrder: 2 },
        }),
        prisma.city.upsert({
            where: { code: "DN" },
            update: {},
            create: { name: "Đà Nẵng", code: "DN", sortOrder: 3 },
        }),
    ]);

    // Create Districts
    const hcmDistricts = ["Quận 1", "Quận 3", "Quận 7", "Bình Thạnh", "Phú Nhuận"];
    for (let i = 0; i < hcmDistricts.length; i++) {
        await prisma.district.upsert({
            where: { code: `HCM-Q${i + 1}` },
            update: {},
            create: {
                name: hcmDistricts[i],
                code: `HCM-Q${i + 1}`,
                cityId: cities[0].id,
                sortOrder: i + 1,
            },
        });
    }
    console.log(`✅ Created ${cities.length} cities with districts\n`);

    // 8. Create Coupons
    console.log("🎟️ Creating coupons...");
    await Promise.all([
        prisma.coupon.upsert({
            where: { code: "WELCOME10" },
            update: {},
            create: {
                code: "WELCOME10",
                type: "percentage",
                value: 10,
                minOrder: 200000,
                maxDiscount: 100000,
                usageLimit: 1000,
                startsAt: new Date(),
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                isActive: true,
            },
        }),
        prisma.coupon.upsert({
            where: { code: "FREESHIP" },
            update: {},
            create: {
                code: "FREESHIP",
                type: "fixed",
                value: 30000,
                minOrder: 300000,
                usageLimit: 500,
                startsAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isActive: true,
            },
        }),
    ]);
    console.log(`✅ Created 2 coupons\n`);

    console.log("🎉 Database seeding completed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
