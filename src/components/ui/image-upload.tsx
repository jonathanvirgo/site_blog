"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string, publicId: string) => void;
    onRemove?: () => void;
    folder?: string;
    placeholder?: string;
    aspectRatio?: string;
    maxSize?: number; // in MB
    disabled?: boolean;
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    folder = "uploads",
    placeholder = "Click to upload or drag and drop",
    aspectRatio = "16/9",
    maxSize = 10,
    disabled = false,
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = useCallback(async (file: File) => {
        setError(null);

        // Validate type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            setError("Chỉ chấp nhận file JPG, PNG, GIF, WebP");
            return;
        }

        // Validate size
        if (file.size > maxSize * 1024 * 1024) {
            setError(`File quá lớn. Tối đa ${maxSize}MB`);
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Upload failed");
            }

            onChange(result.data.secureUrl, result.data.publicId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload thất bại");
        } finally {
            setIsUploading(false);
        }
    }, [folder, maxSize, onChange]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    if (value) {
        return (
            <div className="relative group" style={{ aspectRatio }}>
                <img
                    src={value}
                    alt="Uploaded"
                    className="w-full h-full object-cover rounded-lg"
                />
                {onRemove && !disabled && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                        onClick={onRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div
            className={`relative border-2 border-dashed rounded-lg transition cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{ aspectRatio }}
            onDrop={disabled ? undefined : handleDrop}
            onDragOver={disabled ? undefined : handleDragOver}
            onDragLeave={disabled ? undefined : handleDragLeave}
            onClick={disabled ? undefined : () => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                {isUploading ? (
                    <>
                        <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
                        <p className="text-sm text-muted-foreground">Đang tải lên...</p>
                    </>
                ) : (
                    <>
                        <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{placeholder}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, GIF, WebP (tối đa {maxSize}MB)
                        </p>
                    </>
                )}
            </div>

            {error && (
                <div className="absolute bottom-2 left-2 right-2 bg-destructive/10 text-destructive text-xs p-2 rounded">
                    {error}
                </div>
            )}
        </div>
    );
}

// ==================== MULTI IMAGE UPLOAD ====================

interface MultiImageUploadProps {
    value: { url: string; publicId: string }[];
    onChange: (images: { url: string; publicId: string }[]) => void;
    folder?: string;
    maxImages?: number;
    disabled?: boolean;
}

export function MultiImageUpload({
    value = [],
    onChange,
    folder = "uploads",
    maxImages = 10,
    disabled = false,
}: MultiImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (files: FileList) => {
        if (value.length + files.length > maxImages) {
            alert(`Tối đa ${maxImages} ảnh`);
            return;
        }

        setIsUploading(true);

        try {
            const uploads = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("folder", folder);

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error);

                return {
                    url: result.data.secureUrl,
                    publicId: result.data.publicId,
                };
            });

            const results = await Promise.all(uploads);
            onChange([...value, ...results]);
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = async (index: number) => {
        const image = value[index];

        // Delete from Cloudinary
        try {
            await fetch("/api/upload", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicId: image.publicId }),
            });
        } catch (error) {
            console.error("Delete error:", error);
        }

        const newImages = value.filter((_, i) => i !== index);
        onChange(newImages);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {value.map((image, index) => (
                    <div key={index} className="relative group aspect-square">
                        <img
                            src={image.url}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                        />
                        {!disabled && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition"
                                onClick={() => handleRemove(index)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                ))}

                {value.length < maxImages && !disabled && (
                    <div
                        className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
                        onClick={() => inputRef.current?.click()}
                    >
                        {isUploading ? (
                            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                        ) : (
                            <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
                disabled={disabled}
            />

            <p className="text-xs text-muted-foreground">
                {value.length}/{maxImages} ảnh đã tải lên
            </p>
        </div>
    );
}
