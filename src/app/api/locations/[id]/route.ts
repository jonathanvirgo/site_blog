import { NextRequest } from "next/server";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";

// PUT /api/locations/[id] - Update a location
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { type, name, code, sortOrder, parentId } = body;

        if (!type || !["city", "district", "ward"].includes(type)) {
            return errorResponse("Invalid type");
        }

        if (!name) {
            return errorResponse("Name is required");
        }

        if (type === "city") {
            const city = await prisma.city.update({
                where: { id },
                data: {
                    name,
                    code: code || null,
                    sortOrder: sortOrder || 0,
                },
            });
            return successResponse(city, "City updated");
        }

        if (type === "district") {
            if (!parentId) {
                return errorResponse("City ID is required for district");
            }
            const district = await prisma.district.update({
                where: { id },
                data: {
                    name,
                    code: code || null,
                    sortOrder: sortOrder || 0,
                    cityId: parentId,
                },
            });
            return successResponse(district, "District updated");
        }

        if (type === "ward") {
            if (!parentId) {
                return errorResponse("District ID is required for ward");
            }
            const ward = await prisma.ward.update({
                where: { id },
                data: {
                    name,
                    code: code || null,
                    sortOrder: sortOrder || 0,
                    districtId: parentId,
                },
            });
            return successResponse(ward, "Ward updated");
        }

        return errorResponse("Invalid type");
    } catch (error) {
        console.error("Update location error:", error);
        return serverErrorResponse("Failed to update location");
    }
}

// DELETE /api/locations/[id] - Delete a location
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        if (!type || !["city", "district", "ward"].includes(type)) {
            return errorResponse("Invalid type");
        }

        if (type === "city") {
            // Check if city has districts
            const districtCount = await prisma.district.count({ where: { cityId: id } });
            if (districtCount > 0) {
                return errorResponse(`Cannot delete city with ${districtCount} districts`);
            }
            await prisma.city.delete({ where: { id } });
            return successResponse(null, "City deleted");
        }

        if (type === "district") {
            // Check if district has wards
            const wardCount = await prisma.ward.count({ where: { districtId: id } });
            if (wardCount > 0) {
                return errorResponse(`Cannot delete district with ${wardCount} wards`);
            }
            await prisma.district.delete({ where: { id } });
            return successResponse(null, "District deleted");
        }

        if (type === "ward") {
            await prisma.ward.delete({ where: { id } });
            return successResponse(null, "Ward deleted");
        }

        return errorResponse("Invalid type");
    } catch (error) {
        console.error("Delete location error:", error);
        return serverErrorResponse("Failed to delete location");
    }
}
