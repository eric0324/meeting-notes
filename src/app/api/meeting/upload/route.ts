import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: [
    "https://www.googleapis.com/auth/drive",
  ],
});

const drive = google.drive({ version: "v3", auth });
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

async function findOrCreateFolder(name: string): Promise<string> {
  // Search for existing folder
  const search = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${ROOT_FOLDER_ID}' in parents and trashed=false`,
    fields: "files(id)",
  });

  if (search.data.files && search.data.files.length > 0) {
    return search.data.files[0].id!;
  }

  // Create new folder
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: ROOT_FOLDER_ID ? [ROOT_FOLDER_ID] : undefined,
    },
    fields: "id",
  });

  return folder.data.id!;
}

export async function POST(request: NextRequest) {
  try {
    const { summary, room, attendees, date } = await request.json();

    if (!summary || !room) {
      return NextResponse.json(
        { error: "缺少會議記錄或會議室資訊" },
        { status: 400 }
      );
    }

    // Find or create room folder
    const folderId = await findOrCreateFolder(room);

    // Create Google Doc
    const fileName = `${date || new Date().toLocaleDateString("zh-TW")} - ${room} 會議記錄`;

    const doc = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: "application/vnd.google-apps.document",
        parents: [folderId],
      },
      media: {
        mimeType: "text/plain",
        body: summary,
      },
      fields: "id,webViewLink",
    });

    // Share with attendees
    if (attendees && Array.isArray(attendees)) {
      for (const email of attendees) {
        try {
          await drive.permissions.create({
            fileId: doc.data.id!,
            requestBody: {
              type: "user",
              role: "writer",
              emailAddress: email,
            },
            sendNotificationEmail: false,
          });
        } catch (err) {
          console.error(`Failed to share with ${email}:`, err);
        }
      }
    }

    return NextResponse.json({
      fileId: doc.data.id,
      url: doc.data.webViewLink,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "上傳至 Google Drive 失敗" },
      { status: 500 }
    );
  }
}
