"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon, FileDown, ArrowRight } from "lucide-react";
import { CategoryCrawlerTab } from "../crawler/components/CategoryCrawlerTab";
import { QuickImportTab } from "../crawler/components/QuickImportTab";

interface Category {
    id: string;
    name: string;
}

export default function QuickImportPage() {
    const [articleCategories, setArticleCategories] = useState<Category[]>([]);
    const [productCategories, setProductCategories] = useState<Category[]>([]);
    const [activeTab, setActiveTab] = useState("category");
    const [urlsToImport, setUrlsToImport] = useState<string[]>([]);
    
    // Load categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const [articlesRes, productsRes] = await Promise.all([
                    fetch("/api/categories?type=article"),
                    fetch("/api/categories?type=product"),
                ]);

                if (articlesRes.ok) {
                    const data = await articlesRes.json();
                    setArticleCategories(data.categories || []);
                }
                if (productsRes.ok) {
                    const data = await productsRes.json();
                    setProductCategories(data.categories || []);
                }
            } catch (error) {
                console.error("Failed to load categories:", error);
            }
        };
        loadCategories();
    }, []);
    
    // Handle pushing URLs from CategoryCrawler to QuickImport
    const handlePushToImport = (urls: string[]) => {
        setUrlsToImport(urls);
        setActiveTab("import");
    };
    
    return (
        <div className="container py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Quick Import</h1>
                <p className="text-muted-foreground">
                    Lấy URLs từ danh mục và import nội dung nhanh chóng
                </p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="category" className="gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Lấy URLs từ danh mục
                    </TabsTrigger>
                    <TabsTrigger value="import" className="gap-2">
                        <FileDown className="w-4 h-4" />
                        Import nội dung
                    </TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                    <TabsContent value="category">
                        <CategoryCrawlerTab onPushToImport={handlePushToImport} />
                    </TabsContent>
                    
                    <TabsContent value="import">
                        <QuickImportTab 
                            articleCategories={articleCategories}
                            productCategories={productCategories}
                            initialUrls={urlsToImport}
                        />
                    </TabsContent>
                </div>
            </Tabs>
            
            {/* Flow indicator */}
            {activeTab === "category" && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Quy trình:</span>
                        <span className="flex items-center gap-1">
                            1. Nhập URL danh mục
                        </span>
                        <ArrowRight className="w-4 h-4" />
                        <span className="flex items-center gap-1">
                            2. Chọn URLs bài viết
                        </span>
                        <ArrowRight className="w-4 h-4" />
                        <span className="flex items-center gap-1">
                            3. Đẩy sang Import
                        </span>
                        <ArrowRight className="w-4 h-4" />
                        <span className="flex items-center gap-1">
                            4. Cấu hình selectors & Import
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

