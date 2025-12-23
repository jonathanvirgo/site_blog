import { NextResponse } from "next/server";

/**
 * Standard API Response Format
 * Based on docs/api_specification.md
 */

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Array<{ field?: string; message: string }>;
}

/**
 * Create a success response
 */
export function successResponse<T>(
    data: T,
    message?: string,
    status = 200
): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
        {
            success: true,
            data,
            message,
        },
        { status }
    );
}

/**
 * Create an error response
 */
export function errorResponse(
    message: string,
    status = 400,
    errors?: Array<{ field?: string; message: string }>
): NextResponse<ApiResponse<never>> {
    return NextResponse.json(
        {
            success: false,
            message,
            errors,
        },
        { status }
    );
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
    errors: Array<{ field?: string; message: string }>
): NextResponse<ApiResponse<never>> {
    return NextResponse.json(
        {
            success: false,
            message: "Validation failed",
            errors,
        },
        { status: 400 }
    );
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(
    message = "Unauthorized"
): NextResponse<ApiResponse<never>> {
    return NextResponse.json(
        {
            success: false,
            message,
        },
        { status: 401 }
    );
}

/**
 * Create a not found response
 */
export function notFoundResponse(
    message = "Not found"
): NextResponse<ApiResponse<never>> {
    return NextResponse.json(
        {
            success: false,
            message,
        },
        { status: 404 }
    );
}

/**
 * Create a server error response
 */
export function serverErrorResponse(
    message = "Internal server error"
): NextResponse<ApiResponse<never>> {
    return NextResponse.json(
        {
            success: false,
            message,
        },
        { status: 500 }
    );
}
