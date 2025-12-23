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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ArrowDown, ArrowUp } from "lucide-react";
import type { FieldConfig, Transform } from "../types";

interface FieldConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fieldName: string;
    config: FieldConfig;
    onSave: (config: FieldConfig) => void;
}

const TRANSFORM_TYPES = [
    { value: "trim", label: "Trim - Xóa khoảng trắng" },
    { value: "replace", label: "Replace - Thay thế chuỗi" },
    { value: "regex", label: "Regex - Thay thế regex" },
    { value: "toNumber", label: "To Number - Chuyển số" },
    { value: "removeNonDigit", label: "Remove Non-Digit - Chỉ giữ số" },
    { value: "stripTags", label: "Strip Tags - Xóa HTML" },
    { value: "maxLength", label: "Max Length - Giới hạn độ dài" },
    { value: "addPrefix", label: "Add Prefix - Thêm tiền tố" },
    { value: "addSuffix", label: "Add Suffix - Thêm hậu tố" },
    { value: "toLower", label: "To Lower - Chữ thường" },
    { value: "toUpper", label: "To Upper - CHỮ HOA" },
    { value: "formatPrice", label: "Format Price - Định dạng giá" },
];

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

export function FieldConfigModal({
    open,
    onOpenChange,
    fieldName,
    config,
    onSave,
}: FieldConfigModalProps) {
    const [transforms, setTransforms] = useState<(Transform & { _id: string })[]>([]);
    const [removeElements, setRemoveElements] = useState("");
    const [removeAttributes, setRemoveAttributes] = useState("");
    const [testInput, setTestInput] = useState("");
    const [testResult, setTestResult] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setTransforms(
                (config.transforms || []).map((t) => ({ ...t, _id: generateId() }))
            );
            setRemoveElements((config.removeElements || []).join(", "));
            setRemoveAttributes((config.removeAttributes || []).join(", "));
            setTestResult(null);
        }
    }, [open, config]);

    const addTransform = () => {
        setTransforms([...transforms, { _id: generateId(), type: "trim" }]);
    };

    const updateTransform = (id: string, updates: Partial<Transform>) => {
        setTransforms(
            transforms.map((t) => (t._id === id ? { ...t, ...updates } : t))
        );
    };

    const removeTransform = (id: string) => {
        setTransforms(transforms.filter((t) => t._id !== id));
    };

    const moveTransform = (index: number, direction: "up" | "down") => {
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= transforms.length) return;
        const newTransforms = [...transforms];
        [newTransforms[index], newTransforms[newIndex]] = [
            newTransforms[newIndex],
            newTransforms[index],
        ];
        setTransforms(newTransforms);
    };

    const applyTransforms = (input: string): string => {
        let result = input;
        for (const transform of transforms) {
            try {
                switch (transform.type) {
                    case "trim":
                        result = result.trim();
                        break;
                    case "replace":
                        if (transform.find) {
                            result = result.split(transform.find).join(transform.replace || "");
                        }
                        break;
                    case "regex":
                        if (transform.pattern) {
                            const regex = new RegExp(transform.pattern, transform.flags || "g");
                            result = result.replace(regex, transform.replace || "");
                        }
                        break;
                    case "toNumber":
                        result = String(parseFloat(result.replace(/[^\d.-]/g, "")) || 0);
                        break;
                    case "removeNonDigit":
                        result = result.replace(/\D/g, "");
                        break;
                    case "stripTags":
                        result = result.replace(/<[^>]*>/g, "");
                        break;
                    case "maxLength":
                        if (transform.max && result.length > transform.max) {
                            result = result.substring(0, transform.max) + (transform.ellipsis || "...");
                        }
                        break;
                    case "addPrefix":
                        result = (transform.prefix || "") + result;
                        break;
                    case "addSuffix":
                        result = result + (transform.suffix || "");
                        break;
                    case "toLower":
                        result = result.toLowerCase();
                        break;
                    case "toUpper":
                        result = result.toUpperCase();
                        break;
                    case "formatPrice":
                        const num = parseFloat(result.replace(/[^\d.-]/g, "")) || 0;
                        result = new Intl.NumberFormat("vi-VN").format(num) + (transform.suffix || "đ");
                        break;
                }
            } catch {
                // Skip failed transform
            }
        }
        return result;
    };

    const handleTest = () => {
        if (!testInput) return;
        setTestResult(applyTransforms(testInput));
    };

    const handleSave = () => {
        const newConfig: FieldConfig = {
            transforms: transforms.map(({ _id, ...t }) => t),
            removeElements: removeElements
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            removeAttributes: removeAttributes
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
        };
        onSave(newConfig);
        onOpenChange(false);
    };

    const renderTransformParams = (transform: Transform & { _id: string }) => {
        switch (transform.type) {
            case "replace":
                return (
                    <div className="flex gap-2">
                        <Input
                            placeholder="Tìm"
                            value={transform.find || ""}
                            onChange={(e) => updateTransform(transform._id, { find: e.target.value })}
                            className="w-24"
                        />
                        <Input
                            placeholder="Thay"
                            value={transform.replace || ""}
                            onChange={(e) => updateTransform(transform._id, { replace: e.target.value })}
                            className="w-24"
                        />
                    </div>
                );
            case "regex":
                return (
                    <div className="flex gap-2">
                        <Input
                            placeholder="Pattern"
                            value={transform.pattern || ""}
                            onChange={(e) => updateTransform(transform._id, { pattern: e.target.value })}
                            className="w-24"
                        />
                        <Input
                            placeholder="Flags"
                            value={transform.flags || ""}
                            onChange={(e) => updateTransform(transform._id, { flags: e.target.value })}
                            className="w-12"
                        />
                        <Input
                            placeholder="Thay"
                            value={transform.replace || ""}
                            onChange={(e) => updateTransform(transform._id, { replace: e.target.value })}
                            className="w-20"
                        />
                    </div>
                );
            case "maxLength":
                return (
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Max"
                            value={transform.max || ""}
                            onChange={(e) => updateTransform(transform._id, { max: parseInt(e.target.value) || undefined })}
                            className="w-16"
                        />
                        <Input
                            placeholder="..."
                            value={transform.ellipsis || ""}
                            onChange={(e) => updateTransform(transform._id, { ellipsis: e.target.value })}
                            className="w-12"
                        />
                    </div>
                );
            case "addPrefix":
                return (
                    <Input
                        placeholder="Tiền tố"
                        value={transform.prefix || ""}
                        onChange={(e) => updateTransform(transform._id, { prefix: e.target.value })}
                        className="w-24"
                    />
                );
            case "addSuffix":
            case "formatPrice":
                return (
                    <Input
                        placeholder="Hậu tố"
                        value={transform.suffix || ""}
                        onChange={(e) => updateTransform(transform._id, { suffix: e.target.value })}
                        className="w-24"
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cấu hình: {fieldName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Transforms */}
                    <div className="space-y-3">
                        <Label className="font-medium">Transforms (Biến đổi giá trị)</Label>
                        <div className="border rounded-lg p-3 space-y-2">
                            {transforms.map((transform, index) => (
                                <div key={transform._id} className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                                    <Select
                                        value={transform.type}
                                        onValueChange={(value) =>
                                            updateTransform(transform._id, { type: value as Transform["type"] })
                                        }
                                    >
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TRANSFORM_TYPES.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {renderTransformParams(transform)}
                                    <div className="flex gap-1 ml-auto">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => moveTransform(index, "up")}
                                            disabled={index === 0}
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => moveTransform(index, "down")}
                                            disabled={index === transforms.length - 1}
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeTransform(transform._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addTransform}>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm transform
                            </Button>
                        </div>
                    </div>

                    {/* Test */}
                    <div className="space-y-2">
                        <Label>Test transforms</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Giá trị test"
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                className="flex-1"
                            />
                            <Button variant="outline" onClick={handleTest}>
                                Test
                            </Button>
                        </div>
                        {testResult !== null && (
                            <p className="text-sm text-muted-foreground">
                                → <span className="font-mono">{testResult}</span>
                            </p>
                        )}
                    </div>

                    <hr />

                    {/* Remove Elements */}
                    <div className="space-y-2">
                        <Label>Xóa Elements (CSS selectors, cách nhau bởi dấu phẩy)</Label>
                        <Input
                            placeholder=".ads, script, style, .related-articles"
                            value={removeElements}
                            onChange={(e) => setRemoveElements(e.target.value)}
                        />
                    </div>

                    {/* Remove Attributes */}
                    <div className="space-y-2">
                        <Label>Xóa Attributes (cách nhau bởi dấu phẩy)</Label>
                        <Input
                            placeholder="onclick, onload, class, style"
                            value={removeAttributes}
                            onChange={(e) => setRemoveAttributes(e.target.value)}
                        />
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
