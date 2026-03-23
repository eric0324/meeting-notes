"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type MeetingState = "idle" | "recording" | "paused" | "submitting";

interface Attendee {
  name: string;
  email: string;
}

function MeetingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || "";
  const attendees: Attendee[] = JSON.parse(
    searchParams.get("attendees") || "[]"
  );

  const [state, setState] = useState<MeetingState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setState("recording");

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError("無法存取麥克風，請確認已授權麥克風權限");
    }
  }

  function pauseRecording() {
    mediaRecorderRef.current?.pause();
    stopTimer();
    setState("paused");
  }

  function resumeRecording() {
    mediaRecorderRef.current?.resume();
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    setState("recording");
  }

  async function endMeeting() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    setState("submitting");
    stopTimer();

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    recorder.stream.getTracks().forEach((t) => t.stop());

    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

    try {
      const res = await fetch("/api/meeting/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "audio/webm",
          "x-meeting-room": encodeURIComponent(room),
          "x-meeting-attendees": encodeURIComponent(JSON.stringify(attendees)),
          "x-meeting-date": encodeURIComponent(new Date().toLocaleDateString("zh-TW")),
        },
        body: audioBlob,
      });

      if (!res.ok) throw new Error("上傳失敗");

      // Go home — preserve room param for kiosk mode
      const kioskRoom = searchParams.get("kiosk");
      router.push(kioskRoom ? `/?room=${encodeURIComponent(room)}` : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗");
      setState("idle");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-10 text-center">
        <div className="space-y-1">
          <h1 className="text-lg font-medium">{room}</h1>
          <p className="text-xs text-gray-400">
            {attendees.map((a) => a.name).join("、")}
          </p>
        </div>

        <div className="text-5xl font-light tracking-widest font-mono">
          {formatDuration(duration)}
        </div>

        <div className="text-sm text-gray-400">
          {state === "idle" && "準備開始"}
          {state === "recording" && (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              錄音中
            </span>
          )}
          {state === "paused" && "已暫停"}
          {state === "submitting" && "上傳中..."}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-center gap-3">
          {state === "idle" && (
            <button
              onClick={startRecording}
              className="px-8 py-2.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors"
            >
              開始錄音
            </button>
          )}

          {state === "recording" && (
            <>
              <button
                onClick={pauseRecording}
                className="px-6 py-2.5 text-sm border border-gray-200 rounded hover:border-gray-400 transition-colors"
              >
                暫停
              </button>
              <button
                onClick={endMeeting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors"
              >
                結束會議
              </button>
            </>
          )}

          {state === "paused" && (
            <>
              <button
                onClick={resumeRecording}
                className="px-6 py-2.5 text-sm border border-gray-200 rounded hover:border-gray-400 transition-colors"
              >
                繼續
              </button>
              <button
                onClick={endMeeting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors"
              >
                結束會議
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MeetingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
          載入中...
        </div>
      }
    >
      <MeetingContent />
    </Suspense>
  );
}
