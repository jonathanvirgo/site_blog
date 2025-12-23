"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ImageFieldConfig } from "../types";

interface ImageConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fieldName: string;
    config: ImageFieldConfig;
    onSave: (config: ImageFieldConfig) => void;
}

export function ImageConfigModal({
    open,
    onOpenChange,
    fieldName,
    config,
    onSave,
}: ImageConfigModalProps) {
    const [lazyLoadEnabled, setLazyLoadEnabled] = useState(true);
    const [lazyLoadAttributes, setLazyLoadAttributes] = useState("data-src, data-original, data-lazy-src");
    const [uploadToCloudinary, setUploadToCloudinary] = useState(true);
    const [cloudinaryFolder, setCloudinaryFolder] = useState("imported");
    const [maxSizeMb, setMaxSizeMb] = useState(5);
    const [skipTrackingImages, setSkipTrackingImages] = useState(true);
    const [skipSmallImages, setSkipSmallImages] = useState(true);
    const [minImageSize, setMinImageSize] = useState(50);

    useEffect(() => {
        if (open) {
            setLazyLoadEnabled(config.lazyLoadEnabled ?? true);
            setLazyLoadAttributes((config.lazyLoadAttributes || ["data-src", "data-original", "data-lazy-src"]).join(", "));
            setUploadToCloudinary(config.uploadToCloudinary ?? true);
            setCloudinaryFolder(config.cloudinaryFolder || "imported");
            setMaxSizeMb(config.maxSizeMb || 5);
            setSkipTrackingImages(config.skipTrackingImages ?? true);
            setSkipSmallImages(config.skipSmallImages ?? true);
            setMinImageSize(config.minImageSize || 50);
        }
    }, [open, config]);

    const handleSave = () => {
        const newConfig: ImageFieldConfig = {
            lazyLoadEnabled,
            lazyLoadAttributes: lazyLoadAttributes
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            uploadToCloudinary,
            cloudinaryFolder,
            maxSizeMb,
            skipTrackingImages,
            skipSmallImages,
            minImageSize,
        };
        onSave(newConfig);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Cấu hình ảnh: {fieldName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Lazy Load */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="font-medium">Lazy Load</Label>
                            <Switch
                                checked={lazyLoadEnabled}
                                onCheckedChange={setLazyLoadEnabled}
                            />
                        </div>
                        {lazyLoadEnabled && (
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">
                                    Attributes chứa URL ảnh thực
                                </Label>
                                <Input
                                    value={lazyLoadAttributes}
                                    onChange={(e) => setLazyLoadAttributes(e.target.value)}
                                    placeholder="data-src, data-original"
                                />
                            </div>
                        )}
                    </div>

                    <hr />

                    {/* Upload */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="font-medium">Upload lên Cloudinary</Label>
                            <Switch
                                checked={uploadToCloudinary}
                                onCheckedChange={setUploadToCloudinary}
                            />
                        </div>
                        {uploadToCloudinary && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Folder</Label>
                                    <Input
                                        value={cloudinaryFolder}
                                        onChange={(e) => setCloudinaryFolder(e.target.value)}
                                        placeholder="imported"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Max size (MB)</Label>
                                    <Input
                                        type="number"
                                        value={maxSizeMb}
                                        onChange={(e) => setMaxSizeMb(parseInt(e.target.value) || 5)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <hr />

                    {/* Filter */}
                    <div className="space-y-3">
                        <Label className="font-medium">Bộ lọc ảnh</Label>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">Bỏ qua ảnh tracking (1x1px)</Label>
                                <Switch
                                    checked={skipTrackingImages}
                                    onCheckedChange={setSkipTrackingImages}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm">Bỏ qua ảnh nhỏ hơn</Label>
                                    <Input
                                        type="number"
                                        value={minImageSize}
                                        onChange={(e) => setMinImageSize(parseInt(e.target.value) || 50)}
                                        className="w-16"
                                        disabled={!skipSmallImages}
                                    />
                                    <span className="text-sm text-muted-foreground">px</span>
                                </div>
                                <Switch
                                    checked={skipSmallImages}
                                    onCheckedChange={setSkipSmallImages}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSave}>Lưu</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
