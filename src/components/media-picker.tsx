"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
    Search,
    Upload,
    ImageIcon,
    Check,
    Loader2,
    Folder,
} from "lucide-react";

interface MediaItem {
    id: string;
    publicId: string;
    name: string;
    type: "image" | "video" | "file";
    url: string;
    width?: number;
    height?: number;
    folder: string;
}

interface MediaPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (url: string) => void;
    multiple?: boolean;
    onSelectMultiple?: (urls: string[]) => void;
}

export function MediaPicker({
    open,
    onOpenChange,
    onSelect,
    multiple = false,
    onSelectMultiple,
}: MediaPickerProps) {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [folders, setFolders] = useState<string[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState("library");

    const fetchMedia = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedFolder) params.set("folder", selectedFolder);
            params.set("folders", "true");
            params.set("limit", "50");

            const response = await fetch(`/api/media?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                const items: MediaItem[] = result.data.resources
                    .filter((r: { resourceType: string }) => r.resourceType === "image")
                    .map((r: {
                        publicId: string;
                        secureUrl: string;
                        width?: number;
                        height?: number;
                        folder: string;
                    }) => ({
                        id: r.publicId,
                        publicId: r.publicId,
                        name: r.publicId.split("/").pop() || r.publicId,
                        type: "image",
                        url: r.secureUrl,
                        width: r.width,
                        height: r.height,
                        folder: r.folder,
                    }));

                setMedia(items);
                if (result.data.folders) {
                    setFolders(result.data.folders);
                }
            }
        } catch (error) {
            console.error("Failed to fetch media:", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFolder]);

    useEffect(() => {
        if (open) {
            fetchMedia();
            setSelectedUrls(new Set());
        }
    }, [open, fetchMedia]);

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const uploadedItems: MediaItem[] = [];

        for (const file of Array.from(files)) {
            if (!file.type.startsWith("image/")) continue;
            if (file.size > 10 * 1024 * 1024) continue;

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
                        type: "image",
                        url: result.data.secureUrl,
                        width: result.data.width,
                        height: result.data.height,
                        folder: selectedFolder || "media",
                    });
                }
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
            }
        }

        if (uploadedItems.length > 0) {
            setMedia((prev) => [...uploadedItems, ...prev]);
            // Auto-select newly uploaded images
            if (multiple) {
                setSelectedUrls(prev => {
                    const newSet = new Set(prev);
                    uploadedItems.forEach(item => newSet.add(item.url));
                    return newSet;
                });
            } else if (uploadedItems.length === 1) {
                onSelect(uploadedItems[0].url);
                onOpenChange(false);
            }
        }

        setIsUploading(false);
    };

    const toggleSelection = (url: string) => {
        if (multiple) {
            setSelectedUrls((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(url)) {
                    newSet.delete(url);
                } else {
                    newSet.add(url);
                }
                return newSet;
            });
        } else {
            onSelect(url);
            onOpenChange(false);
        }
    };

    const handleConfirm = () => {
        if (multiple && onSelectMultiple) {
            onSelectMultiple(Array.from(selectedUrls));
        }
        onOpenChange(false);
    };

    const filteredMedia = media.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Chọn hình ảnh</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList>
                        <TabsTrigger value="library">
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Thư viện
                        </TabsTrigger>
                        <TabsTrigger value="upload">
                            <Upload className="mr-2 h-4 w-4" />
                            Tải lên
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="library" className="flex-1 flex gap-4 min-h-0 mt-4">
                        {/* Folder sidebar */}
                        <div className="w-40 flex-shrink-0 space-y-1 overflow-y-auto">
                            <button
                                onClick={() => setSelectedFolder(null)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left",
                                    selectedFolder === null
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                )}
                            >
                                <Folder className="h-4 w-4" />
                                Tất cả
                            </button>
                            {folders.map((folder) => (
                                <button
                                    key={folder}
                                    onClick={() => setSelectedFolder(folder)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left truncate",
                                        selectedFolder === folder
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <Folder className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{folder}</span>
                                </button>
                            ))}
                        </div>

                        {/* Media grid */}
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Search */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm ảnh..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Grid */}
                            <div className="flex-1 overflow-y-auto">
                                {isLoading ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <Skeleton key={i} className="aspect-square rounded-lg" />
                                        ))}
                                    </div>
                                ) : filteredMedia.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <ImageIcon className="h-12 w-12 mb-4" />
                                        <p>Chưa có hình ảnh nào</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-3">
                                        {filteredMedia.map((item) => {
                                            const isSelected = selectedUrls.has(item.url);
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => toggleSelection(item.url)}
                                                    className={cn(
                                                        "relative aspect-square rounded-lg overflow-hidden border-2 transition group",
                                                        isSelected
                                                            ? "border-primary ring-2 ring-primary ring-offset-2"
                                                            : "border-transparent hover:border-muted-foreground/50"
                                                    )}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={item.url}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                                            <Check className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                                                        <p className="text-white text-xs truncate">
                                                            {item.name}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="upload" className="flex-1 mt-4">
                        <label
                            className={cn(
                                "flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer transition",
                                isUploading
                                    ? "opacity-50 pointer-events-none"
                                    : "hover:border-primary hover:bg-muted/50"
                            )}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                multiple={multiple}
                                className="hidden"
                                onChange={(e) => handleUpload(e.target.files)}
                                disabled={isUploading}
                            />
                            {isUploading ? (
                                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        Click để chọn ảnh hoặc kéo thả vào đây
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        JPG, PNG, GIF, WebP (tối đa 10MB)
                                    </p>
                                </>
                            )}
                        </label>
                    </TabsContent>
                </Tabs>

                {multiple && selectedUrls.size > 0 && (
                    <DialogFooter className="flex items-center justify-between border-t pt-4">
                        <Badge variant="secondary">
                            Đã chọn {selectedUrls.size} ảnh
                        </Badge>
                        <Button onClick={handleConfirm}>
                            Xác nhận
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
