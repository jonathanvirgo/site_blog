import { NextRequest } from "next/server";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";

// GET /api/locations - Get cities, districts, or wards
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "province"; // province | district | ward | all
        const provinceId = searchParams.get("provinceId");
        const districtId = searchParams.get("districtId");
        const cityId = searchParams.get("cityId"); // Alias for provinceId

        if (type === "province" || type === "city") {
            // Get all cities/provinces with district count
            const cities = await prisma.city.findMany({
                orderBy: { sortOrder: "asc" },
                include: {
                    _count: { select: { districts: true } }
                }
            });

            return successResponse(cities.map(c => ({
                id: c.id,
                name: c.name,
                code: c.code,
                sortOrder: c.sortOrder,
                districtCount: c._count.districts,
            })));
        }

        if (type === "district") {
            // Get districts for a province/city
            const parentId = provinceId || cityId;
            const districts = await prisma.district.findMany({
                where: parentId ? { cityId: parentId } : undefined,
                orderBy: { sortOrder: "asc" },
                include: {
                    city: { select: { name: true } },
                    _count: { select: { wards: true } }
                }
            });

            return successResponse(districts.map(d => ({
                id: d.id,
                name: d.name,
                code: d.code,
                sortOrder: d.sortOrder,
                cityId: d.cityId,
                cityName: d.city.name,
                wardCount: d._count.wards,
            })));
        }

        if (type === "ward") {
            // Get wards for a district
            const wards = await prisma.ward.findMany({
                where: districtId ? { districtId } : undefined,
                orderBy: { sortOrder: "asc" },
                include: {
                    district: {
                        select: {
                            name: true,
                            city: { select: { name: true } }
                        }
                    }
                }
            });

            return successResponse(wards.map(w => ({
                id: w.id,
                name: w.name,
                code: w.code,
                sortOrder: w.sortOrder,
                districtId: w.districtId,
                districtName: w.district.name,
            })));
        }

        // Default: return all locations in hierarchical structure
        const cities = await prisma.city.findMany({
            orderBy: { sortOrder: "asc" },
            include: {
                districts: {
                    orderBy: { sortOrder: "asc" },
                    include: {
                        wards: {
                            orderBy: { sortOrder: "asc" }
                        }
                    }
                }
            }
        });

        return successResponse(cities);
    } catch (error) {
        console.error("Get locations error:", error);
        return serverErrorResponse("Failed to fetch locations");
    }
}

// POST /api/locations - Create a new location
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, name, code, sortOrder, parentId } = body;

        if (!type || !["city", "district", "ward"].includes(type)) {
            return errorResponse("Invalid type");
        }

        if (!name) {
            return errorResponse("Name is required");
        }

        if (type === "city") {
            const city = await prisma.city.create({
                data: {
                    name,
                    code: code || null,
                    sortOrder: sortOrder || 0,
                },
            });
            return successResponse(city, "City created");
        }

        if (type === "district") {
            if (!parentId) {
                return errorResponse("City ID is required for district");
            }
            const district = await prisma.district.create({
                data: {
                    name,
                    code: code || null,
                    sortOrder: sortOrder || 0,
                    cityId: parentId,
                },
            });
            return successResponse(district, "District created");
        }

        if (type === "ward") {
            if (!parentId) {
                return errorResponse("District ID is required for ward");
            }
            const ward = await prisma.ward.create({
                data: {
                    name,
                    code: code || null,
                    sortOrder: sortOrder || 0,
                    districtId: parentId,
                },
            });
            return successResponse(ward, "Ward created");
        }

        return errorResponse("Invalid type");
    } catch (error) {
        console.error("Create location error:", error);
        return serverErrorResponse("Failed to create location");
    }
}

