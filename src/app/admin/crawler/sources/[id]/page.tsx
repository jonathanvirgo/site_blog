"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SourceEditorTabs } from "../../components/SourceEditorTabs";
import type { CrawlSourceFormData } from "../../types";
import { Loader2 } from "lucide-react";

export default function EditSourcePage() {
    const params = useParams();
    const sourceId = params.id as string;
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<CrawlSourceFormData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSource = async () => {
            try {
                const res = await fetch(`/api/crawler/sources/${sourceId}`);
                if (!res.ok) {
                    throw new Error("Không tìm thấy nguồn");
                }
                const response = await res.json();

                // API returns { source: { ... } }
                const data = response.source;

                if (!data) {
                    throw new Error("Dữ liệu nguồn không hợp lệ");
                }

                // Transform data to form format
                const formData: CrawlSourceFormData = {
                    name: data.name || "",
                    baseUrl: data.baseUrl || "",
                    crawlType: data.crawlType || "article",
                    isActive: data.isActive ?? true,
                    requestDelayMs: data.requestDelayMs || 2000,
                    requestTimeout: 30000,
                    requestHeaders: data.requestHeaders || {},
                    seoConfig: data.seoConfig || { enabled: true },
                    listPageEnabled: data.listPageEnabled ?? false,
                    categoryMappings: data.categoryMappings || [],
                    listItemSelector: data.listItemSelector || "",
                    listLinkSelector: data.listLinkSelector || "",
                    listImageSelector: data.listImageSelector || "",
                    listTitleSelector: data.listTitleSelector || "",
                    paginationConfig: data.paginationConfig || {
                        type: "next_button",
                        maxPages: data.listMaxPages || 5,
                    },
                    selectors: data.selectors || {},
                };

                setInitialData(formData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Lỗi không xác định");
            } finally {
                setLoading(false);
            }
        };

        fetchSource();
    }, [sourceId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-destructive/10 text-destructive p-4 rounded">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <SourceEditorTabs sourceId={sourceId} initialData={initialData!} />
        </div>
    );
}
