import { NextRequest, NextResponse } from "next/server";
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} from "@aws-sdk/client-transcribe";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Anthropic from "@anthropic-ai/sdk";
import { google } from "googleapis";
import { Readable } from "stream";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const transcribe = new TranscribeClient({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET_NAME!;

async function processInBackground(
  jobName: string,
  s3Key: string,
  room: string,
  attendees: { name: string; email: string }[],
  date: string,
  audioBuffer: ArrayBuffer
) {
  try {
    // 1. Poll Transcribe until done
    console.log(`[${jobName}] Waiting for transcription...`);
    let transcript = null;
    while (!transcript) {
      await new Promise((r) => setTimeout(r, 5000));
      const result = await transcribe.send(
        new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
      );
      const status = result.TranscriptionJob?.TranscriptionJobStatus;

      if (status === "COMPLETED") {
        const uri = result.TranscriptionJob?.Transcript?.TranscriptFileUri;
        if (uri) {
          const res = await fetch(uri);
          transcript = await res.json();
        }
      } else if (status === "FAILED") {
        throw new Error(
          result.TranscriptionJob?.FailureReason || "轉錄失敗"
        );
      }
    }

    // 2. Format transcript with speaker labels
    const items = transcript?.results?.items || [];
    const segments = transcript?.results?.speaker_labels?.segments || [];
    let formattedTranscript = "";
    let currentSpeaker = "";

    for (const segment of segments) {
      if (segment.speaker_label !== currentSpeaker) {
        currentSpeaker = segment.speaker_label;
        formattedTranscript += `\n\n${currentSpeaker}: `;
      }
      for (const item of segment.items) {
        const matchedItem = items.find(
          (i: { start_time?: string; end_time?: string }) =>
            i.start_time === item.start_time && i.end_time === item.end_time
        );
        if (matchedItem) {
          formattedTranscript += matchedItem.alternatives?.[0]?.content || "";
        }
      }
    }

    // 3. Claude API summarize
    console.log(`[${jobName}] Summarizing with Claude...`);
    const claude = new Anthropic();
    const message = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `你是一位專業的會議記錄助理。請根據以下會議逐字稿，整理出結構化的會議記錄。

會議資訊：
- 日期：${date}
- 會議室：${room}
- 與會者：${attendees.map((a) => a.name).join("、")}

逐字稿：
${formattedTranscript.trim()}

請以以下格式輸出會議記錄（使用 Markdown）：

# 會議記錄

## 基本資訊
- 日期：
- 會議室：
- 與會者：

## 討論重點摘要
（列出主要討論的議題和重點）

## 決議事項
（列出會議中做出的決定）

## 待辦事項 (Action Items)
| 項目 | 負責人 | 期限 |
|------|--------|------|
（如果逐字稿中有提到具體的待辦事項和負責人，請列出）`,
        },
      ],
    });

    const summary =
      message.content[0].type === "text" ? message.content[0].text : "";

    // 4. Upload to Google Drive (impersonate admin user to avoid SA quota)
    console.log(`[${jobName}] Uploading to Google Drive...`);
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive"],
      subject: process.env.GOOGLE_ADMIN_EMAIL,
    });
    const drive = google.drive({ version: "v3", auth });
    const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    // Find or create room folder
    const search = await drive.files.list({
      q: `name='${room}' and mimeType='application/vnd.google-apps.folder' and '${ROOT_FOLDER_ID}' in parents and trashed=false`,
      fields: "files(id)",
    });

    let roomFolderId: string;
    if (search.data.files && search.data.files.length > 0) {
      roomFolderId = search.data.files[0].id!;
    } else {
      const folder = await drive.files.create({
        requestBody: {
          name: room,
          mimeType: "application/vnd.google-apps.folder",
          parents: ROOT_FOLDER_ID ? [ROOT_FOLDER_ID] : undefined,
        },
        fields: "id",
      });
      roomFolderId = folder.data.id!;
    }

    // Create meeting subfolder
    const prefix = `${date} - ${room}`;
    const meetingFolder = await drive.files.create({
      requestBody: {
        name: prefix,
        mimeType: "application/vnd.google-apps.folder",
        parents: [roomFolderId],
      },
      fields: "id,webViewLink",
    });
    const meetingFolderId = meetingFolder.data.id!;

    // Upload audio (.webm)
    await drive.files.create({
      requestBody: {
        name: `${prefix} 音訊.webm`,
        parents: [meetingFolderId],
      },
      media: {
        mimeType: "audio/webm",
        body: Readable.from(Buffer.from(audioBuffer)),
      },
    });

    // Upload transcript (Google Doc)
    await drive.files.create({
      requestBody: {
        name: `${prefix} 逐字稿`,
        mimeType: "application/vnd.google-apps.document",
        parents: [meetingFolderId],
      },
      media: {
        mimeType: "text/plain",
        body: formattedTranscript.trim(),
      },
    });

    // Upload meeting notes (Google Doc)
    await drive.files.create({
      requestBody: {
        name: `${prefix} 會議記錄`,
        mimeType: "application/vnd.google-apps.document",
        parents: [meetingFolderId],
      },
      media: {
        mimeType: "text/plain",
        body: summary,
      },
    });

    // Share folder with attendees (files inherit)
    for (const attendee of attendees) {
      try {
        await drive.permissions.create({
          fileId: meetingFolderId,
          requestBody: {
            type: "user",
            role: "writer",
            emailAddress: attendee.email,
          },
          sendNotificationEmail: true,
        });
      } catch (err) {
        console.error(`[${jobName}] Failed to share with ${attendee.email}:`, err);
      }
    }

    console.log(`[${jobName}] Done! Folder: ${meetingFolder.data.webViewLink}`);
  } catch (error) {
    console.error(`[${jobName}] Background processing failed:`, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const audioBuffer = await request.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: "未提供音訊檔案" },
        { status: 400 }
      );
    }

    // Parse meeting info from headers (URL-encoded)
    const room = decodeURIComponent(request.headers.get("x-meeting-room") || "");
    const attendees = JSON.parse(
      decodeURIComponent(request.headers.get("x-meeting-attendees") || "[]")
    );
    const date = decodeURIComponent(
      request.headers.get("x-meeting-date") || ""
    ) || new Date().toLocaleDateString("zh-TW");

    const jobName = `meeting-${Date.now()}`;
    const s3Key = `audio/${jobName}.webm`;

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: new Uint8Array(audioBuffer),
        ContentType: "audio/webm",
      })
    );

    // Start transcription job
    await transcribe.send(
      new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: "zh-TW",
        MediaFormat: "webm",
        Media: {
          MediaFileUri: `s3://${BUCKET}/${s3Key}`,
        },
        Settings: {
          ShowSpeakerLabels: true,
          MaxSpeakerLabels: 10,
        },
      })
    );

    // Fire and forget — process in background
    processInBackground(jobName, s3Key, room, attendees, date, audioBuffer);

    return NextResponse.json({ jobName, status: "processing" });
  } catch (error) {
    console.error("Transcribe error:", error);
    return NextResponse.json(
      { error: "轉錄失敗" },
      { status: 500 }
    );
  }
}
