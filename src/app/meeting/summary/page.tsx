"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Attendee {
  name: string;
  email: string;
}

function SummaryContent() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || "";
  const attendees: Attendee[] = JSON.parse(
    searchParams.get("attendees") || "[]"
  );
  const transcript = searchParams.get("transcript") || "";

  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function generateSummary() {
      try {
        const res = await fetch("/api/meeting/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            meetingInfo: {
              date: new Date().toLocaleDateString("zh-TW"),
              room,
              attendees: attendees.map((a) => a.name),
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "整理失敗");
        setSummary(data.summary);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "整理會議記錄失敗，請重試"
        );
      } finally {
        setLoading(false);
      }
    }

    generateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload() {
    setUploading(true);
    setError("");

    try {
      const res = await fetch("/api/meeting/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          room,
          attendees: attendees.map((a) => a.email),
          date: new Date().toLocaleDateString("zh-TW"),
        }),
      });

      if (!res.ok) throw new Error("上傳失敗");
      const data = await res.json();
      setDriveUrl(data.url);
    } catch {
      setError("上傳至 Google Drive 失敗");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-900">整理會議記錄中</div>
          <div className="text-xs text-gray-400">正在使用 AI 分析逐字稿...</div>
        </div>
      </div>
    );
  }

  if (driveUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <div className="text-sm font-medium">上傳成功</div>
            <p className="text-xs text-gray-400">
              會議記錄已上傳並分享給所有與會者
            </p>
          </div>
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors"
          >
            開啟 Google Doc
          </a>
          <div>
            <a
              href="/"
              className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
            >
              返回首頁
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-medium">會議記錄</h1>
          <p className="text-xs text-gray-400">
            {room} — {attendees.map((a) => a.name).join("、")}
          </p>
        </div>

        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full min-h-[400px] border border-gray-100 rounded p-4 text-sm leading-relaxed outline-none focus:border-gray-300 transition-colors resize-y bg-transparent"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading || !summary}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {uploading ? "上傳中..." : "上傳至 Google Drive"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
          載入中...
        </div>
      }
    >
      <SummaryContent />
    </Suspense>
  );
}
