"use client";

import { fetchTeacherData, type TeacherData } from "./teacher-store";
import { supabaseBrowser } from "./supabase/client";

export const ADMIN_DATA_EVENT = "cic-admin-data";

export interface School {
  id: string;
  name: string;
  city: string;
  state: string;
  contactName: string;
  contactEmail: string;
  createdAt: string;
}

export interface TeacherAccount {
  id: string;
  name: string;
  email: string;
  schoolId: string | null;
}

interface SchoolRow {
  id: string;
  name: string;
  city: string;
  state: string;
  contact_name: string;
  contact_email: string;
  created_at: string;
}
interface TeacherRow {
  id: string;
  display_name: string | null;
  email: string | null;
  school_id: string | null;
  role: string;
}

export interface AdminData {
  data: TeacherData;
  schools: School[];
  teachers: TeacherAccount[];
  reviewers: TeacherAccount[];
}

const toAccount = (t: TeacherRow): TeacherAccount => ({ id: t.id, name: t.display_name ?? "", email: t.email ?? "", schoolId: t.school_id });

/** Everything the CIC admin sees. Row-level security gives admins every class. */
export async function fetchAdminData(): Promise<AdminData> {
  const db = supabaseBrowser();
  const [data, schools, teachers] = await Promise.all([
    fetchTeacherData(),
    db.from("schools").select("id, name, city, state, contact_name, contact_email, created_at").order("name"),
    db.from("profiles").select("id, display_name, email, school_id, role").in("role", ["teacher", "reviewer"]).order("display_name"),
  ]);
  if (schools.error) throw new Error(schools.error.message);
  if (teachers.error) throw new Error(teachers.error.message);
  return {
    data,
    schools: (schools.data as SchoolRow[]).map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      state: s.state,
      contactName: s.contact_name,
      contactEmail: s.contact_email,
      createdAt: s.created_at,
    })),
    teachers: (teachers.data as TeacherRow[]).filter((t) => t.role === "teacher").map(toAccount),
    reviewers: (teachers.data as TeacherRow[]).filter((t) => t.role === "reviewer").map(toAccount),
  };
}

export interface OnboardInput {
  schoolId?: string;
  school?: { name: string; city: string; contactName: string; contactEmail: string };
  account?: { role: "teacher" | "reviewer"; name: string; email: string };
}

export interface OnboardResult {
  schoolId?: string;
  account?: { role: "teacher" | "reviewer"; email: string; tempPassword: string };
}

/** Asks the server to add a school and/or a teacher account (admins only). */
export async function onboard(input: OnboardInput): Promise<OnboardResult> {
  const res = await fetch("/api/admin/onboard", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json().catch(() => ({}))) as OnboardResult & { error?: string; message?: string };
  if (!res.ok) throw new Error(body.message ?? "Something went wrong. Please try again.");
  window.dispatchEvent(new Event(ADMIN_DATA_EVENT));
  return body;
}
