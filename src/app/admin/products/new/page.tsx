"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    Eye,
    Plus,
    Trash,
    GripVertical,
    ImageIcon,
    Loader2,
    X,
    Settings,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Variant {
    id: string;
    sku: string;
    price: number;
    salePrice?: number;
    stock: number;
    attributes: Record<string, string>;
    isDefault: boolean;
}

interface Attribute {
    id: string;
    name: string;
    values: string[];
}

interface Category {
    id: string;
    name: string;
    slug: string;
    children?: Category[];
}

export default function NewProductPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [status, setStatus] = useState("draft");
    const [categoryId, setCategoryId] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [hasVariants, setHasVariants] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);

    // Attributes for variants
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [variants, setVariants] = useState<Variant[]>([
        {
            id: "default",
            sku: "",
            price: 0,
            stock: 0,
            attributes: {},
            isDefault: true,
        },
    ]);

    // Fetch categories
    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch("/api/categories?type=product");
                if (res.ok) {
                    const data = await res.json();
                    const flatCategories: Category[] = [];
                    const flatten = (cats: Category[], prefix = "") => {
                        cats.forEach(cat => {
                            flatCategories.push({
                                id: cat.id,
                                name: prefix + cat.name,
                                slug: cat.slug
                            });
                            if (cat.children?.length) flatten(cat.children, prefix + "— ");
                        });
                    };
                    flatten(data.data?.productCategories || []);
                    setCategories(flatCategories);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        }
        fetchCategories();
    }, []);

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    const handleNameChange = (value: string) => {
        setName(value);
        if (!slug || slug === generateSlug(name)) {
            setSlug(generateSlug(value));
        }
    };

    // Add new attribute
    const addAttribute = () => {
        setAttributes([
            ...attributes,
            { id: Date.now().toString(), name: "", values: [] },
        ]);
    };

    // Remove attribute
    const removeAttribute = (id: string) => {
        setAttributes(attributes.filter((a) => a.id !== id));
    };

    // Update attribute name
    const updateAttributeName = (id: string, name: string) => {
        setAttributes(
            attributes.map((a) => (a.id === id ? { ...a, name } : a))
        );
    };

    // Add value to attribute
    const addAttributeValue = (id: string, value: string) => {
        if (!value.trim()) return;
        setAttributes(
            attributes.map((a) =>
                a.id === id ? { ...a, values: [...a.values, value] } : a
            )
        );
    };

    // Remove value from attribute
    const removeAttributeValue = (attrId: string, valueIndex: number) => {
        setAttributes(
            attributes.map((a) =>
                a.id === attrId
                    ? { ...a, values: a.values.filter((_, i) => i !== valueIndex) }
                    : a
            )
        );
    };

    // Generate variants from attributes
    const generateVariants = () => {
        if (attributes.length === 0 || attributes.some((a) => a.values.length === 0)) {
            return;
        }

        const combinations: Record<string, string>[] = [];

        const generate = (index: number, current: Record<string, string>) => {
            if (index === attributes.length) {
                combinations.push({ ...current });
                return;
            }

            const attr = attributes[index];
            for (const value of attr.values) {
                current[attr.name] = value;
                generate(index + 1, current);
            }
        };

        generate(0, {});

        const newVariants: Variant[] = combinations.map((attrs, i) => ({
            id: Date.now().toString() + i,
            sku: generateSKU(attrs),
            price: variants[0]?.price || 0,
            stock: 0,
            attributes: attrs,
            isDefault: i === 0,
        }));

        setVariants(newVariants);
    };

    const generateSKU = (attrs: Record<string, string>) => {
        const slugName = generateSlug(name).slice(0, 10).toUpperCase();
        const attrPart = Object.values(attrs)
            .map((v) => v.slice(0, 3).toUpperCase())
            .join("-");
        return `${slugName}-${attrPart}`;
    };

    const updateVariant = (id: string, field: string, value: string | number) => {
        setVariants(
            variants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
        );
    };

    const handleSave = async (publishNow: boolean) => {
        if (!name.trim()) {
            toast.error("Vui lòng nhập tên sản phẩm");
            return;
        }
        if (!variants[0]?.sku) {
            toast.error("Vui lòng nhập SKU");
            return;
        }

        setSaving(true);
        try {
            const productData = {
                name,
                slug: slug || generateSlug(name),
                description,
                shortDescription,
                status: publishNow ? "active" : status,
                categoryId: categoryId || null,
                isFeatured,
                hasVariants,
                images,
                metaTitle: metaTitle || null,
                metaDescription: metaDescription || null,
                variants: (hasVariants ? variants : [variants[0]]).map(v => ({
                    sku: v.sku,
                    price: v.price,
                    salePrice: v.salePrice || null,
                    stockQuantity: v.stock,
                    isDefault: v.isDefault,
                })),
            };

            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productData),
            });

            if (res.ok) {
                const data = await res.json();
                const newProduct = data.data;
                toast.success("Đã tạo sản phẩm thành công!");
                router.push(`/admin/products/${newProduct.id}/edit`);
            } else {
                const error = await res.json();
                toast.error(error.message || "Lưu sản phẩm thất bại");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Thêm sản phẩm mới</h1>
                        <p className="text-muted-foreground">
                            Tạo sản phẩm với biến thể
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleSave(false)}>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu nháp
                    </Button>
                    <Button onClick={() => handleSave(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Xuất bản
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin cơ bản</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên sản phẩm *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Nhập tên sản phẩm..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="slug"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        placeholder="url-san-pham"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => setSlug(generateSlug(name))}
                                    >
                                        Tạo tự động
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="shortDesc">Mô tả ngắn</Label>
                                <Textarea
                                    id="shortDesc"
                                    value={shortDescription}
                                    onChange={(e) => setShortDescription(e.target.value)}
                                    placeholder="Mô tả ngắn gọn về sản phẩm..."
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả chi tiết</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Mô tả chi tiết sản phẩm..."
                                    rows={5}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Images */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hình ảnh sản phẩm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground mt-2">
                                        Thêm ảnh
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Variants Toggle */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Biến thể sản phẩm</span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasVariants}
                                        onChange={(e) => setHasVariants(e.target.checked)}
                                        className="h-4 w-4 rounded"
                                    />
                                    <span className="text-sm font-normal">
                                        Sản phẩm có nhiều biến thể
                                    </span>
                                </label>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!hasVariants ? (
                                // Simple product - single variant
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>SKU</Label>
                                        <Input
                                            value={variants[0]?.sku || ""}
                                            onChange={(e) =>
                                                updateVariant("default", "sku", e.target.value)
                                            }
                                            placeholder="SKU-001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Giá bán (VND)</Label>
                                        <Input
                                            type="number"
                                            value={variants[0]?.price || ""}
                                            onChange={(e) =>
                                                updateVariant("default", "price", Number(e.target.value))
                                            }
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tồn kho</Label>
                                        <Input
                                            type="number"
                                            value={variants[0]?.stock || ""}
                                            onChange={(e) =>
                                                updateVariant("default", "stock", Number(e.target.value))
                                            }
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            ) : (
                                // Product with variants
                                <div className="space-y-6">
                                    {/* Attributes */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Thuộc tính (VD: Màu sắc, Kích thước)</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addAttribute}
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Thêm thuộc tính
                                            </Button>
                                        </div>

                                        {attributes.map((attr, index) => (
                                            <div
                                                key={attr.id}
                                                className="p-4 border rounded-lg space-y-3"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={attr.name}
                                                        onChange={(e) =>
                                                            updateAttributeName(attr.id, e.target.value)
                                                        }
                                                        placeholder="Tên thuộc tính (VD: Màu sắc)"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeAttribute(attr.id)}
                                                    >
                                                        <Trash className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {attr.values.map((value, vIndex) => (
                                                        <Badge
                                                            key={vIndex}
                                                            variant="secondary"
                                                            className="cursor-pointer"
                                                            onClick={() =>
                                                                removeAttributeValue(attr.id, vIndex)
                                                            }
                                                        >
                                                            {value} ×
                                                        </Badge>
                                                    ))}
                                                    <Input
                                                        placeholder="Thêm giá trị..."
                                                        className="w-32 h-6 text-sm"
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                addAttributeValue(
                                                                    attr.id,
                                                                    (e.target as HTMLInputElement).value
                                                                );
                                                                (e.target as HTMLInputElement).value = "";
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        {attributes.length > 0 && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={generateVariants}
                                            >
                                                Tạo biến thể từ thuộc tính
                                            </Button>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Variants Table */}
                                    {variants.length > 0 && variants[0].attributes && Object.keys(variants[0].attributes).length > 0 && (
                                        <div className="space-y-2">
                                            <Label>Danh sách biến thể ({variants.length})</Label>
                                            <div className="border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Biến thể</TableHead>
                                                            <TableHead>SKU</TableHead>
                                                            <TableHead>Giá (VND)</TableHead>
                                                            <TableHead>Tồn kho</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {variants.map((variant) => (
                                                            <TableRow key={variant.id}>
                                                                <TableCell>
                                                                    <div className="flex gap-1">
                                                                        {Object.entries(variant.attributes).map(
                                                                            ([key, value]) => (
                                                                                <Badge key={key} variant="outline">
                                                                                    {value}
                                                                                </Badge>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        value={variant.sku}
                                                                        onChange={(e) =>
                                                                            updateVariant(
                                                                                variant.id,
                                                                                "sku",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className="w-32"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        value={variant.price}
                                                                        onChange={(e) =>
                                                                            updateVariant(
                                                                                variant.id,
                                                                                "price",
                                                                                Number(e.target.value)
                                                                            )
                                                                        }
                                                                        className="w-28"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        value={variant.stock}
                                                                        onChange={(e) =>
                                                                            updateVariant(
                                                                                variant.id,
                                                                                "stock",
                                                                                Number(e.target.value)
                                                                            )
                                                                        }
                                                                        className="w-20"
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Trạng thái</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {["draft", "active", "inactive"].map((s) => (
                                    <Badge
                                        key={s}
                                        variant={status === s ? "default" : "outline"}
                                        className="cursor-pointer"
                                        onClick={() => setStatus(s)}
                                    >
                                        {s === "draft" && "Nháp"}
                                        {s === "active" && "Đang bán"}
                                        {s === "inactive" && "Ngừng bán"}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Danh mục</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn danh mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Featured */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Tùy chọn</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="h-4 w-4 rounded"
                                />
                                <div>
                                    <p className="font-medium">Sản phẩm nổi bật</p>
                                    <p className="text-sm text-muted-foreground">
                                        Hiển thị ở trang chủ
                                    </p>
                                </div>
                            </label>
                        </CardContent>
                    </Card>

                    {/* SEO */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                SEO
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="metaTitle">Meta Title</Label>
                                <Input
                                    id="metaTitle"
                                    value={metaTitle}
                                    onChange={(e) => setMetaTitle(e.target.value)}
                                    placeholder={name || "Tiêu đề SEO"}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Để trống để sử dụng tên sản phẩm
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="metaDesc">Meta Description</Label>
                                <Textarea
                                    id="metaDesc"
                                    value={metaDescription}
                                    onChange={(e) => setMetaDescription(e.target.value)}
                                    placeholder={shortDescription || "Mô tả SEO (155-160 ký tự)"}
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Để trống để sử dụng mô tả ngắn
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
