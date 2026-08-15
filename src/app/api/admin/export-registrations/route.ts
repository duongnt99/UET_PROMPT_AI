import { NextResponse } from "next/server";
import { exportRegistrationsCsv } from "@/server/actions/admin-actions";

export async function GET() {
  const csv = await exportRegistrationsCsv();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="registrations.csv"',
    },
  });
}
