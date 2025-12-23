"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    Eye,
    Plus,
    Trash,
    ImageIcon,
    Loader2,
    X,
    FolderOpen,
    Settings,
} from "lucide-react";
import { toast } from "sonner";
import { MediaPicker } from "@/components/media-picker";

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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
    const { id } = use(params);
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

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showMediaPicker, setShowMediaPicker] = useState(false);

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

    // Fetch product data
    useEffect(() => {
        async function fetchProduct() {
            try {
                const res = await fetch(`/api/products/${id}`);
                if (res.ok) {
                    const product = await res.json();

                    setName(product.name || "");
                    setSlug(product.slug || "");
                    setDescription(product.description || "");
                    setShortDescription(product.shortDescription || "");
                    setStatus(product.status || "draft");
                    setCategoryId(product.categoryId || "");
                    setIsFeatured(product.isFeatured || false);
                    // Parse images - ensure it's always an array
                    const productImages = product.images;
                    if (Array.isArray(productImages)) {
                        setImages(productImages);
                    } else if (typeof productImages === 'string') {
                        try {
                            const parsed = JSON.parse(productImages);
                            setImages(Array.isArray(parsed) ? parsed : []);
                        } catch {
                            setImages(productImages ? [productImages] : []);
                        }
                    } else {
                        setImages([]);
                    }

                    // Handle variants
                    if (product.variants && product.variants.length > 0) {
                        setHasVariants(product.variants.length > 1);
                        setVariants(product.variants.map((v: Record<string, unknown>) => ({
                            id: v.id as string,
                            sku: v.sku as string || "",
                            price: v.price as number || 0,
                            salePrice: v.salePrice as number || undefined,
                            stock: v.stockQuantity as number || 0,
                            attributes: {},
                            isDefault: v.isDefault as boolean || false,
                        })));
                    }

                    // Load SEO fields
                    setMetaTitle(product.metaTitle || "");
                    setMetaDescription(product.metaDescription || "");
                } else {
                    toast.error("Không tìm thấy sản phẩm");
                    router.push("/admin/products");
                }
            } catch (error) {
                console.error("Failed to fetch product:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProduct();
    }, [id, router]);

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("folder", "products");

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    const data = await res.json();
                    const url = data.data?.url || data.url;
                    setImages(prev => [...prev, url]);
                }
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Có lỗi xảy ra khi upload");
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    // Add new attribute
    const addAttribute = () => {
        setAttributes([
            ...attributes,
            { id: Date.now().toString(), name: "", values: [] },
        ]);
    };

    // Remove attribute
    const removeAttribute = (attrId: string) => {
        setAttributes(attributes.filter((a) => a.id !== attrId));
    };

    // Update attribute name
    const updateAttributeName = (attrId: string, name: string) => {
        setAttributes(
            attributes.map((a) => (a.id === attrId ? { ...a, name } : a))
        );
    };

    // Add value to attribute
    const addAttributeValue = (attrId: string, value: string) => {
        if (!value.trim()) return;
        setAttributes(
            attributes.map((a) =>
                a.id === attrId ? { ...a, values: [...a.values, value] } : a
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

    const updateVariant = (variantId: string, field: string, value: string | number) => {
        setVariants(
            variants.map((v) => (v.id === variantId ? { ...v, [field]: value } : v))
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
                images,
                metaTitle: metaTitle || null,
                metaDescription: metaDescription || null,
                variants: (hasVariants ? variants : [variants[0]]).map(v => ({
                    id: v.id !== "default" && !v.id.startsWith(Date.now().toString().slice(0, 5)) ? v.id : undefined,
                    sku: v.sku,
                    price: v.price,
                    salePrice: v.salePrice || null,
                    stockQuantity: v.stock,
                    isDefault: v.isDefault,
                })),
            };

            const res = await fetch(`/api/products/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productData),
            });

            if (res.ok) {
                toast.success("Đã lưu sản phẩm thành công!");
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

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Đã xóa sản phẩm thành công!");
                router.push("/admin/products");
            } else {
                toast.error("Xóa sản phẩm thất bại");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                        <h1 className="text-2xl font-bold">Chỉnh sửa sản phẩm</h1>
                        <p className="text-muted-foreground">
                            Cập nhật thông tin sản phẩm
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Xóa
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleSave(false)}
                        disabled={saving}
                    >
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Lưu
                    </Button>
                    {status !== "active" && (
                        <Button onClick={() => handleSave(true)} disabled={saving}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Eye className="mr-2 h-4 w-4" />
                            )}
                            Xuất bản
                        </Button>
                    )}
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
                                    onChange={(e) => setName(e.target.value)}
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
                            <CardTitle className="flex items-center justify-between">
                                <span>Hình ảnh sản phẩm</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowMediaPicker(true)}
                                >
                                    <FolderOpen className="h-4 w-4 mr-2" />
                                    Chọn từ thư viện
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4">
                                {images.map((img, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <img
                                            src={img}
                                            alt={`Product ${index + 1}`}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    ) : (
                                        <>
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground mt-2">
                                                Thêm ảnh mới
                                            </span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media Picker Dialog */}
                    <MediaPicker
                        open={showMediaPicker}
                        onOpenChange={setShowMediaPicker}
                        multiple={true}
                        onSelect={(url) => setImages(prev => [...prev, url])}
                        onSelectMultiple={(urls) => setImages(prev => [...prev, ...urls])}
                    />

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
                                        <Label>SKU *</Label>
                                        <Input
                                            value={variants[0]?.sku || ""}
                                            onChange={(e) =>
                                                updateVariant(variants[0]?.id || "default", "sku", e.target.value)
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
                                                updateVariant(variants[0]?.id || "default", "price", Number(e.target.value))
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
                                                updateVariant(variants[0]?.id || "default", "stock", Number(e.target.value))
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

                                        {attributes.map((attr) => (
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
                                    {variants.length > 0 && (
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
                                                                        {Object.keys(variant.attributes).length > 0 ? (
                                                                            Object.entries(variant.attributes).map(
                                                                                ([key, value]) => (
                                                                                    <Badge key={key} variant="outline">
                                                                                        {value}
                                                                                    </Badge>
                                                                                )
                                                                            )
                                                                        ) : (
                                                                            <span className="text-muted-foreground">Mặc định</span>
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

            {/* Delete Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Sản phẩm sẽ bị xóa vĩnh viễn và không thể khôi phục.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
