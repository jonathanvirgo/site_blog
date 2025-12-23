"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash,
    MapPin,
    Building2,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface City {
    id: string;
    name: string;
    code: string | null;
    sortOrder: number;
    districtCount: number;
}

interface District {
    id: string;
    name: string;
    code: string | null;
    sortOrder: number;
    cityId: string;
    cityName: string;
    wardCount: number;
}

interface Ward {
    id: string;
    name: string;
    code: string | null;
    sortOrder: number;
    districtId: string;
    districtName: string;
}

export default function LocationsPage() {
    const [activeTab, setActiveTab] = useState("cities");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<"city" | "district" | "ward">("city");
    const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);

    const [cities, setCities] = useState<City[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        parentId: "",
        sortOrder: 0,
    });

    // Fetch data
    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const [citiesRes, districtsRes, wardsRes] = await Promise.all([
                fetch("/api/locations?type=city"),
                fetch("/api/locations?type=district"),
                fetch("/api/locations?type=ward"),
            ]);

            if (citiesRes.ok) {
                const data = await citiesRes.json();
                setCities(data.data || []);
            }
            if (districtsRes.ok) {
                const data = await districtsRes.json();
                setDistricts(data.data || []);
            }
            if (wardsRes.ok) {
                const data = await wardsRes.json();
                setWards(data.data || []);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateDialog = (type: "city" | "district" | "ward") => {
        setDialogType(type);
        setEditingItem(null);
        setFormData({ name: "", code: "", parentId: "", sortOrder: 0 });
        setIsDialogOpen(true);
    };

    const openEditDialog = (type: "city" | "district" | "ward", item: City | District | Ward) => {
        setDialogType(type);
        setEditingItem(item as unknown as Record<string, unknown>);
        setFormData({
            name: item.name,
            code: item.code || "",
            parentId: ('cityId' in item ? item.cityId : 'districtId' in item ? item.districtId : "") as string,
            sortOrder: item.sortOrder || 0,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Vui lòng nhập tên");
            return;
        }

        setSaving(true);
        try {
            const url = editingItem
                ? `/api/locations/${editingItem.id}`
                : "/api/locations";

            const res = await fetch(url, {
                method: editingItem ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: dialogType,
                    name: formData.name,
                    code: formData.code || null,
                    sortOrder: formData.sortOrder,
                    parentId: formData.parentId || null,
                }),
            });

            if (res.ok) {
                toast.success("Đã lưu thành công!");
                setIsDialogOpen(false);
                fetchLocations();
            } else {
                const error = await res.json();
                toast.error(error.message || "Lưu thất bại");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (type: string, id: string) => {
        const typeName = type === "city" ? "tỉnh/thành" : type === "district" ? "quận/huyện" : "phường/xã";
        if (!confirm(`Bạn có chắc muốn xóa ${typeName} này?`)) return;

        try {
            const res = await fetch(`/api/locations/${id}?type=${type}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Đã xóa thành công!");
                fetchLocations();
            } else {
                const error = await res.json();
                toast.error(error.message || "Xóa thất bại");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Có lỗi xảy ra");
        }
    };

    const getDialogTitle = () => {
        const action = editingItem ? "Chỉnh sửa" : "Thêm";
        switch (dialogType) {
            case "city": return `${action} Tỉnh/Thành phố`;
            case "district": return `${action} Quận/Huyện`;
            case "ward": return `${action} Phường/Xã`;
        }
    };

    // Filter data by search query
    const filteredCities = cities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredDistricts = districts.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredWards = wards.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <div>
                    <h1 className="text-3xl font-bold">Địa điểm</h1>
                    <p className="text-muted-foreground">Quản lý tỉnh/thành, quận/huyện, phường/xã</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="cities">Tỉnh/Thành ({cities.length})</TabsTrigger>
                        <TabsTrigger value="districts">Quận/Huyện ({districts.length})</TabsTrigger>
                        <TabsTrigger value="wards">Phường/Xã ({wards.length})</TabsTrigger>
                    </TabsList>

                    <Button onClick={() => openCreateDialog(
                        activeTab === "cities" ? "city" :
                            activeTab === "districts" ? "district" : "ward"
                    )}>
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm mới
                    </Button>
                </div>

                {/* Search */}
                <div className="relative w-full max-w-md mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Cities Table */}
                <TabsContent value="cities">
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Mã</TableHead>
                                    <TableHead>Quận/Huyện</TableHead>
                                    <TableHead>Thứ tự</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            Chưa có dữ liệu
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCities.map((city) => (
                                    <TableRow key={city.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{city.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {city.code && <Badge variant="outline">{city.code}</Badge>}
                                        </TableCell>
                                        <TableCell>{city.districtCount}</TableCell>
                                        <TableCell>{city.sortOrder}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog("city", city)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDelete("city", city.id)}
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Districts Table */}
                <TabsContent value="districts">
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Mã</TableHead>
                                    <TableHead>Tỉnh/Thành</TableHead>
                                    <TableHead>Phường/Xã</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDistricts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            Chưa có dữ liệu
                                        </TableCell>
                                    </TableRow>
                                ) : filteredDistricts.map((district) => (
                                    <TableRow key={district.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{district.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {district.code && <Badge variant="outline">{district.code}</Badge>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {district.cityName}
                                        </TableCell>
                                        <TableCell>{district.wardCount}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog("district", district)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDelete("district", district.id)}
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Wards Table */}
                <TabsContent value="wards">
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Mã</TableHead>
                                    <TableHead>Quận/Huyện</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredWards.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            Chưa có dữ liệu
                                        </TableCell>
                                    </TableRow>
                                ) : filteredWards.map((ward) => (
                                    <TableRow key={ward.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{ward.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {ward.code && <Badge variant="outline">{ward.code}</Badge>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {ward.districtName}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog("ward", ward)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDelete("ward", ward.id)}
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{getDialogTitle()}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tên *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="VD: Quận 1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mã</Label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="VD: Q1"
                            />
                        </div>

                        {dialogType === "district" && (
                            <div className="space-y-2">
                                <Label>Tỉnh/Thành phố *</Label>
                                <Select
                                    value={formData.parentId}
                                    onValueChange={(v) => setFormData({ ...formData, parentId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn tỉnh/thành" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map((city) => (
                                            <SelectItem key={city.id} value={city.id}>
                                                {city.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {dialogType === "ward" && (
                            <div className="space-y-2">
                                <Label>Quận/Huyện *</Label>
                                <Select
                                    value={formData.parentId}
                                    onValueChange={(v) => setFormData({ ...formData, parentId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn quận/huyện" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {districts.map((district) => (
                                            <SelectItem key={district.id} value={district.id}>
                                                {district.name} - {district.cityName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {dialogType === "city" && (
                            <div className="space-y-2">
                                <Label>Thứ tự hiển thị</Label>
                                <Input
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                                    placeholder="1"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {editingItem ? "Cập nhật" : "Tạo mới"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
