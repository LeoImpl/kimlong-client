import "server-only";
import { cache } from "react";
import type { components } from "@/types/admin-api";
import { SALES_API, staffFetch } from "./staff-fetch";

type Schemas = components["schemas"];

export type Staff = Schemas["StaffView"];

/**
 * The signed-in person as the platform sees them. Calling it also records them in the staff directory, which is
 * what makes them selectable as "nhân viên phụ trách". Once per request, however many components ask.
 */
export const getMe = cache((): Promise<Staff> => staffFetch<Staff>(`${SALES_API}/me`));

export const listStaff = cache((): Promise<Staff[]> => staffFetch<Staff[]>(`${SALES_API}/staff`));
