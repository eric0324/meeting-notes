import { NextResponse } from "next/server";
import { google } from "googleapis";

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: [
      "https://www.googleapis.com/auth/admin.directory.resource.calendar.readonly",
    ],
    subject: process.env.GOOGLE_ADMIN_EMAIL,
  });
}

export async function GET() {
  try {
    const auth = getAuth();
    const directory = google.admin({ version: "directory_v1", auth });

    const res = await directory.resources.calendars.list({
      customer: "my_customer",
      maxResults: 100,
    });

    const rooms = (res.data.items || [])
      .filter((r) => r.resourceName?.includes("會議"))
      .map((r) => ({
        name: r.resourceName || "",
        calendarEmail: r.resourceEmail || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "zh-TW"));

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Rooms API error:", error);
    return NextResponse.json(
      { error: "無法載入會議室清單" },
      { status: 500 }
    );
  }
}
