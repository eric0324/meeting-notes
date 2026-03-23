import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    subject: process.env.GOOGLE_ADMIN_EMAIL,
  });
}

export async function GET(request: NextRequest) {
  const calendarEmail = request.nextUrl.searchParams.get("calendarEmail");

  if (!calendarEmail) {
    return NextResponse.json(
      { error: "缺少 calendarEmail 參數" },
      { status: 400 }
    );
  }

  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 60 * 1000);

    // Check upcoming events
    const events = await calendar.events.list({
      calendarId: calendarEmail,
      timeMin: now.toISOString(),
      timeMax: soon.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 1,
    });

    let event = events.data.items?.[0];

    // If no upcoming, check ongoing
    if (!event) {
      const ongoingEvents = await calendar.events.list({
        calendarId: calendarEmail,
        timeMin: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        timeMax: now.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      event = ongoingEvents.data.items?.find((e) => {
        const end = new Date(e.end?.dateTime || "");
        return end > now;
      });
    }

    if (!event) {
      return NextResponse.json({ attendees: [], event: null });
    }

    const attendees = (event.attendees || [])
      .filter((a) => !a.resource && a.email)
      .map((a) => ({
        name: a.displayName || a.email?.split("@")[0] || "",
        email: a.email || "",
      }));

    return NextResponse.json({
      attendees,
      event: {
        summary: event.summary || "",
        start: event.start?.dateTime || "",
        end: event.end?.dateTime || "",
      },
    });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "無法查詢行事曆" },
      { status: 500 }
    );
  }
}
