"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    Upload,
    Search,
    Grid,
    List,
    Trash,
    Copy,
    Check,
    ImageIcon,
    FileIcon,
    Film,
    MoreHorizontal,
    Loader2,
    RefreshCw,
    Folder,
    ChevronRight,
    FolderInput,
    X,
    CheckSquare,
    FolderPlus,
    ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MediaItem {
    id: string;
    publicId: string;
    name: string;
    type: "image" | "video" | "file";
    size: number;
    url: string;
    width?: number;
    height?: number;
    createdAt: string;
    folder: string;
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function extractFileName(publicId: string): string {
    const parts = publicId.split("/");
    return parts[parts.length - 1];
}

export default function MediaPage() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [folders, setFolders] = useState<string[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Multi-select state
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [targetFolder, setTargetFolder] = useState("");
    const [isMoving, setIsMoving] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch media from Cloudinary
    const fetchMedia = useCallback(async (cursor?: string, append = false) => {
        if (cursor) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }

        try {
            const params = new URLSearchParams();
            if (selectedFolder) params.set("folder", selectedFolder);
            if (cursor) params.set("cursor", cursor);
            params.set("folders", "true");
            params.set("limit", "30");

            const response = await fetch(`/api/media?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                const items: MediaItem[] = result.data.resources.map((r: {
                    publicId: string;
                    secureUrl: string;
                    bytes: number;
                    width?: number;
                    height?: number;
                    createdAt: string;
                    folder: string;
                    resourceType: string;
                }) => ({
                    id: r.publicId,
                    publicId: r.publicId,
                    name: extractFileName(r.publicId),
                    type: r.resourceType === "video" ? "video" : "image",
                    size: r.bytes,
                    url: r.secureUrl,
                    width: r.width,
                    height: r.height,
                    createdAt: new Date(r.createdAt).toLocaleDateString("vi-VN"),
                    folder: r.folder,
                }));

                if (append) {
                    setMedia((prev) => [...prev, ...items]);
                } else {
                    setMedia(items);
                }

                setNextCursor(result.data.nextCursor || null);

                if (result.data.folders) {
                    setFolders(result.data.folders);
                }
            }
        } catch (error) {
            console.error("Failed to fetch media:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [selectedFolder]);

    // Initial fetch
    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    // Clear selection when exiting selection mode
    useEffect(() => {
        if (!isSelectionMode) {
            setSelectedItems(new Set());
        }
    }, [isSelectionMode]);

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const toggleItemSelection = (id: string) => {
        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const selectAll = () => {
        setSelectedItems(new Set(filteredMedia.map((m) => m.id)));
    };

    const deselectAll = () => {
        setSelectedItems(new Set());
    };

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) return;
        if (!confirm(`Bạn có chắc muốn xóa ${selectedItems.size} file?`)) return;

        setIsBulkDeleting(true);
        const itemsToDelete = Array.from(selectedItems);

        for (const publicId of itemsToDelete) {
            try {
                await fetch("/api/upload", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ publicId }),
                });
            } catch (error) {
                console.error(`Failed to delete ${publicId}:`, error);
            }
        }

        setMedia((prev) => prev.filter((m) => !selectedItems.has(m.id)));
        setSelectedItems(new Set());
        setIsSelectionMode(false);
        setIsBulkDeleting(false);
    };

    const handleMove = async () => {
        if (selectedItems.size === 0 || !targetFolder) return;

        setIsMoving(true);
        try {
            const publicIds = Array.from(selectedItems);
            // Convert __root__ to empty string for root folder
            const actualFolder = targetFolder === "__root__" ? "" : targetFolder;
            const response = await fetch("/api/media/move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicIds, targetFolder: actualFolder }),
            });

            const result = await response.json();

            if (result.success) {
                // Update local state with new publicIds and folders
                setMedia((prev) =>
                    prev.map((m) => {
                        if (selectedItems.has(m.id)) {
                            const moveResult = result.results.find(
                                (r: { newPublicId: string }) => r.newPublicId.endsWith(m.name)
                            );
                            if (moveResult?.success) {
                                return {
                                    ...m,
                                    id: moveResult.newPublicId,
                                    publicId: moveResult.newPublicId,
                                    folder: targetFolder,
                                };
                            }
                        }
                        return m;
                    })
                );

                setSelectedItems(new Set());
                setIsSelectionMode(false);
                setShowMoveDialog(false);
                setTargetFolder("");
                toast.success(result.message || "Đã di chuyển file thành công!");
            } else {
                toast.error(result.error || "Di chuyển thất bại");
            }
        } catch (error) {
            console.error("Move failed:", error);
            toast.error("Đã xảy ra lỗi khi di chuyển");
        } finally {
            setIsMoving(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        setIsCreatingFolder(true);
        try {
            const response = await fetch("/api/media/move", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderName: newFolderName.trim() }),
            });

            const result = await response.json();

            if (result.success) {
                setFolders(result.folders);
                setTargetFolder(newFolderName.trim().replace(/[^a-zA-Z0-9_-]/g, "_"));
                setNewFolderName("");
                toast.success("Đã tạo folder mới!");
            } else {
                toast.error(result.error || "Tạo folder thất bại");
            }
        } catch (error) {
            console.error("Create folder failed:", error);
        } finally {
            setIsCreatingFolder(false);
        }
    };

    const handleUpload = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        const uploadedItems: MediaItem[] = [];
        const totalFiles = files.length;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validate file type
            const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4"];
            if (!allowedTypes.includes(file.type)) {
                console.warn(`Skipping ${file.name}: unsupported type`);
                continue;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                console.warn(`Skipping ${file.name}: file too large`);
                continue;
            }

            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("folder", selectedFolder || "media");

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    uploadedItems.push({
                        id: result.data.publicId,
                        publicId: result.data.publicId,
                        name: file.name,
                        type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file",
                        size: result.data.bytes,
                        url: result.data.secureUrl,
                        width: result.data.width,
                        height: result.data.height,
                        createdAt: new Date().toLocaleDateString("vi-VN"),
                        folder: selectedFolder || "media",
                    });
                }
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
            }

            setUploadProgress(((i + 1) / totalFiles) * 100);
        }

        setMedia((prev) => [...uploadedItems, ...prev]);
        setIsUploading(false);
        setUploadProgress(0);
    }, [selectedFolder]);

    const handleDelete = async (item: MediaItem) => {
        if (!confirm("Bạn có chắc muốn xóa file này?")) return;

        try {
            const response = await fetch("/api/upload", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicId: item.publicId }),
            });

            if (response.ok) {
                setMedia((prev) => prev.filter((m) => m.id !== item.id));
                if (selectedMedia?.id === item.id) setSelectedMedia(null);
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const filteredMedia = media.filter((m) => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "all" || m.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case "image": return ImageIcon;
            case "video": return Film;
            default: return FileIcon;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Media</h1>
                    <p className="text-muted-foreground">Quản lý hình ảnh và video (Cloudinary)</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={isSelectionMode ? "secondary" : "outline"}
                        onClick={() => setIsSelectionMode(!isSelectionMode)}
                    >
                        {isSelectionMode ? <X className="mr-2 h-4 w-4" /> : <CheckSquare className="mr-2 h-4 w-4" />}
                        {isSelectionMode ? "Hủy chọn" : "Chọn nhiều"}
                    </Button>
                    <Button variant="outline" onClick={() => fetchMedia()} disabled={isLoading}>
                        <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                        Làm mới
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        Upload
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files)}
                    />
                </div>
            </div>

            {/* Bulk Action Bar */}
            {isSelectionMode && selectedItems.size > 0 && (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg border">
                    <span className="font-medium">Đã chọn {selectedItems.size} file</span>
                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" size="sm" onClick={selectAll}>
                            Chọn tất cả
                        </Button>
                        <Button variant="outline" size="sm" onClick={deselectAll}>
                            Bỏ chọn
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowMoveDialog(true)}>
                            <FolderInput className="mr-2 h-4 w-4" />
                            Di chuyển
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                        >
                            {isBulkDeleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash className="mr-2 h-4 w-4" />
                            )}
                            Xóa ({selectedItems.size})
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex gap-6">
                {/* Folder Sidebar */}
                <div className="w-56 flex-shrink-0">
                    <div className="border rounded-lg p-4 space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Thư mục</h3>
                        <button
                            onClick={() => setSelectedFolder(null)}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                                selectedFolder === null ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                            )}
                        >
                            <Folder className="h-4 w-4" />
                            Tất cả
                            <Badge variant="secondary" className="ml-auto text-xs">
                                {media.length}
                            </Badge>
                        </button>
                        {folders.map((folder) => {
                            const count = media.filter(m => m.folder === folder || m.folder.startsWith(folder + "/")).length;
                            return (
                                <button
                                    key={folder}
                                    onClick={() => setSelectedFolder(folder)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                                        selectedFolder === folder ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                    )}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                    {folder}
                                    {count > 0 && (
                                        <Badge variant="secondary" className="ml-auto text-xs">
                                            {count}
                                        </Badge>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-4 min-w-0">
                    {/* Filters */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm file..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="image">Hình ảnh</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex border rounded-lg">
                            <Button
                                variant={viewMode === "grid" ? "secondary" : "ghost"}
                                size="icon"
                                onClick={() => setViewMode("grid")}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "secondary" : "ghost"}
                                size="icon"
                                onClick={() => setViewMode("list")}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>

                        <Badge variant="outline" className="ml-auto">
                            {filteredMedia.length} files
                        </Badge>
                    </div>

                    {/* Upload Zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${isDragging ? "border-primary bg-primary/10" : "border-muted"
                            } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            handleUpload(e.dataTransfer.files);
                        }}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-4" />
                                <p className="text-muted-foreground">Đang tải lên... {Math.round(uploadProgress)}%</p>
                                <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2 mt-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    Kéo thả file vào đây hoặc{" "}
                                    <button
                                        className="text-primary underline"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        chọn file
                                    </button>
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Hỗ trợ: JPG, PNG, GIF, WebP, MP4 (tối đa 10MB)
                                </p>
                            </>
                        )}
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square rounded-lg" />
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && media.length === 0 && (
                        <div className="text-center py-12">
                            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">Chưa có media nào</p>
                            <p className="text-muted-foreground">Upload ảnh đầu tiên của bạn hoặc kiểm tra cấu hình Cloudinary</p>
                        </div>
                    )}

                    {/* Media Grid/List */}
                    {!isLoading && viewMode === "grid" ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredMedia.map((item) => {
                                const Icon = getIcon(item.type);
                                const isSelected = selectedItems.has(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer border transition",
                                            isSelected ? "border-primary ring-2 ring-primary" : "hover:border-primary"
                                        )}
                                        onClick={() => {
                                            if (isSelectionMode) {
                                                toggleItemSelection(item.id);
                                            } else {
                                                setSelectedMedia(item);
                                            }
                                        }}
                                    >
                                        {item.type === "image" ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icon className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                        )}

                                        {/* Selection checkbox */}
                                        {isSelectionMode && (
                                            <div className="absolute top-2 left-2 z-10">
                                                <div className={cn(
                                                    "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                                                    isSelected
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "bg-background/80 border-muted-foreground"
                                                )}>
                                                    {isSelected && <Check className="h-4 w-4" />}
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                                            <p className="text-white text-xs truncate">{item.name}</p>
                                        </div>
                                        {!isSelectionMode && (
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="secondary" size="icon" className="h-7 w-7">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyUrl(item.url); }}>
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Copy URL
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="text-destructive">
                                                            <Trash className="mr-2 h-4 w-4" />
                                                            Xóa
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : !isLoading && (
                        <div className="border rounded-lg divide-y">
                            {filteredMedia.map((item) => {
                                const Icon = getIcon(item.type);
                                const isSelected = selectedItems.has(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-center gap-4 p-4 cursor-pointer transition",
                                            isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                                        )}
                                        onClick={() => {
                                            if (isSelectionMode) {
                                                toggleItemSelection(item.id);
                                            } else {
                                                setSelectedMedia(item);
                                            }
                                        }}
                                    >
                                        {isSelectionMode && (
                                            <div className={cn(
                                                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                                                isSelected
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-muted-foreground"
                                            )}>
                                                {isSelected && <Check className="h-3 w-3" />}
                                            </div>
                                        )}
                                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {item.type === "image" ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Icon className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatFileSize(item.size)} • {item.createdAt}
                                                {item.width && item.height && ` • ${item.width}x${item.height}`}
                                                {item.folder && ` • 📁 ${item.folder}`}
                                            </p>
                                        </div>
                                        <Badge variant="outline">{item.type}</Badge>
                                        {!isSelectionMode && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyUrl(item.url); }}>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Copy URL
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="text-destructive">
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Load More */}
                    {nextCursor && !isLoading && (
                        <div className="flex justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={() => fetchMedia(nextCursor, true)}
                                disabled={isLoadingMore}
                            >
                                {isLoadingMore ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Tải thêm
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Dialog - Fixed overflow */}
            <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="truncate pr-8">{selectedMedia?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedMedia && (
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                {selectedMedia.type === "image" ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={selectedMedia.url}
                                        alt={selectedMedia.name}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                ) : selectedMedia.type === "video" ? (
                                    <video
                                        src={selectedMedia.url}
                                        controls
                                        className="max-w-full max-h-full"
                                    />
                                ) : (
                                    <Film className="h-16 w-16 text-muted-foreground" />
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Loại</p>
                                    <p className="font-medium capitalize">{selectedMedia.type}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Kích thước</p>
                                    <p className="font-medium">{formatFileSize(selectedMedia.size)}</p>
                                </div>
                                {selectedMedia.width && selectedMedia.height && (
                                    <div>
                                        <p className="text-muted-foreground">Kích cỡ</p>
                                        <p className="font-medium">{selectedMedia.width}x{selectedMedia.height}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground">Folder</p>
                                    <p className="font-medium">{selectedMedia.folder || "root"}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm mb-1">Public ID</p>
                                <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                                    {selectedMedia.publicId}
                                </code>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm mb-1">URL</p>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1 block overflow-hidden">
                                        {selectedMedia.url}
                                    </code>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => copyUrl(selectedMedia.url)}>
                                        {copiedUrl === selectedMedia.url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <Button variant="outline" onClick={() => window.open(selectedMedia.url, "_blank")}>
                                    Mở trong tab mới
                                </Button>
                                <Button variant="destructive" onClick={() => handleDelete(selectedMedia)}>
                                    <Trash className="mr-2 h-4 w-4" />
                                    Xóa
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Move to Folder Dialog */}
            <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Di chuyển {selectedItems.size} file</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Chọn folder đích</label>
                            <Select value={targetFolder} onValueChange={setTargetFolder}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn folder..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__root__">📁 Root (gốc)</SelectItem>
                                    {folders.map((folder) => (
                                        <SelectItem key={folder} value={folder}>
                                            📂 {folder}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="border-t pt-4">
                            <label className="text-sm font-medium">Hoặc tạo folder mới</label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    placeholder="Tên folder mới..."
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                />
                                <Button
                                    variant="outline"
                                    onClick={handleCreateFolder}
                                    disabled={isCreatingFolder || !newFolderName.trim()}
                                >
                                    {isCreatingFolder ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FolderPlus className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Chỉ dùng chữ cái, số, gạch ngang và gạch dưới
                            </p>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
                                Hủy
                            </Button>
                            <Button
                                onClick={handleMove}
                                disabled={isMoving || !targetFolder}
                            >
                                {isMoving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                )}
                                Di chuyển
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
