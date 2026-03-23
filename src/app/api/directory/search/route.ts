import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: [
      "https://www.googleapis.com/auth/admin.directory.user.readonly",
    ],
    subject: process.env.GOOGLE_ADMIN_EMAIL,
  });
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const auth = getAuth();
    const directory = google.admin({ version: "directory_v1", auth });

    // Strip domain part if user typed full email
    const searchTerm = q.includes("@") ? q.split("@")[0] : q;

    // Directory API query only supports single field search
    const res = await directory.users.list({
      customer: "my_customer",
      query: `email:${searchTerm}*`,
      maxResults: 10,
    });

    const users = (res.data.users || []).map((u) => ({
      name: u.name?.fullName || "",
      email: u.primaryEmail || "",
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Directory API error:", error);
    return NextResponse.json(
      { error: "無法搜尋通訊錄" },
      { status: 500 }
    );
  }
}
