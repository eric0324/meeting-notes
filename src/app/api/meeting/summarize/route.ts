import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { transcript, meetingInfo } = await request.json();

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "未提供逐字稿，請先錄音再整理" },
        { status: 400 }
      );
    }

    const prompt = `你是一位專業的會議記錄助理。請根據以下會議逐字稿，整理出結構化的會議記錄。

會議資訊：
- 日期：${meetingInfo?.date || new Date().toLocaleDateString("zh-TW")}
- 會議室：${meetingInfo?.room || "未指定"}
- 與會者：${meetingInfo?.attendees?.join("、") || "未指定"}

逐字稿：
${transcript}

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
（如果逐字稿中有提到具體的待辦事項和負責人，請列出）`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const summary =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json(
      { error: "整理會議記錄失敗" },
      { status: 500 }
    );
  }
}
