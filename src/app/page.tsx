"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Attendee {
  name: string;
  email: string;
}

interface Room {
  name: string;
  calendarEmail: string;
}

interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
}

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRoom = searchParams.get("room") || "";
  const isKiosk = !!defaultRoom;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState(defaultRoom);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Attendee[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [calendarEvent, setCalendarEvent] = useState<CalendarEvent | null>(
    null
  );
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  useEffect(() => {
    fetch("/api/rooms")
      .then((res) => res.json())
      .then(setRooms)
      .catch(() => setError("無法載入會議室清單"));
  }, []);

  // Fetch calendar info for selected room
  const fetchCalendar = useCallback(
    (roomName: string, autoAddAttendees: boolean) => {
      if (!roomName) {
        setCalendarEvent(null);
        return;
      }

      const room = rooms.find((r) => r.name === roomName);
      if (!room?.calendarEmail) {
        setCalendarEvent(null);
        return;
      }

      setLoadingCalendar(true);
      fetch(
        `/api/rooms/calendar?calendarEmail=${encodeURIComponent(room.calendarEmail)}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.event) {
            setCalendarEvent(data.event);
          } else {
            setCalendarEvent(null);
          }

          // Auto-add suggested attendees (only on first load or room change)
          if (autoAddAttendees && data.attendees?.length > 0) {
            setAttendees((prev) => {
              const merged = [...prev];
              for (const a of data.attendees) {
                if (!merged.find((m: Attendee) => m.email === a.email)) {
                  merged.push(a);
              }
            }
            return merged;
          });
        }
          })
        .catch(() => {})
        .finally(() => setLoadingCalendar(false));
    },
    [rooms]
  );

  // Fetch on room change (wait for rooms to load)
  useEffect(() => {
    if (rooms.length > 0) fetchCalendar(selectedRoom, true);
  }, [selectedRoom, rooms, fetchCalendar]);

  // Auto-refresh calendar every 60s in kiosk mode
  useEffect(() => {
    if (!isKiosk || !selectedRoom) return;
    const interval = setInterval(() => {
      fetchCalendar(selectedRoom, true);
    }, 60_000);
    return () => clearInterval(interval);
  }, [isKiosk, selectedRoom, fetchCalendar]);

  const searchDirectory = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/directory/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchDirectory(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchDirectory]);

  function addAttendee(person: Attendee) {
    if (!attendees.find((a) => a.email === person.email)) {
      setAttendees([...attendees, person]);
    }
    setSearchQuery("");
    setSearchResults([]);
  }

  function removeAttendee(email: string) {
    setAttendees(attendees.filter((a) => a.email !== email));
  }

  function handleStart() {
    if (attendees.length === 0 || !selectedRoom) {
      setError("請選擇與會者和會議室");
      return;
    }
    setError("");
    const params = new URLSearchParams({
      room: selectedRoom,
      attendees: JSON.stringify(
        attendees.map((a) => ({ name: a.name, email: a.email }))
      ),
    });
    if (isKiosk) params.set("kiosk", "1");
    router.push(`/meeting?${params.toString()}`);
  }

  function formatTime(isoString: string) {
    return new Date(isoString).toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-xl font-medium tracking-tight">
          {isKiosk ? selectedRoom : "新會議"}
        </h1>

        {/* Meeting Room */}
        {isKiosk ? (
          // Kiosk mode: room is fixed, just show calendar info
          <div className="space-y-2">
            {loadingCalendar && (
              <p className="text-xs text-gray-400">查詢行事曆中...</p>
            )}

            {calendarEvent ? (
              <div className="bg-gray-50 rounded p-3 space-y-1">
                <p className="text-xs text-gray-500">目前會議</p>
                <p className="text-sm font-medium">{calendarEvent.summary}</p>
                <p className="text-xs text-gray-400">
                  {formatTime(calendarEvent.start)} –{" "}
                  {formatTime(calendarEvent.end)}
                </p>
              </div>
            ) : (
              !loadingCalendar && (
                <p className="text-xs text-gray-400">目前沒有排定的會議</p>
              )
            )}
          </div>
        ) : (
          // Normal mode: select room
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              會議室
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => {
                setSelectedRoom(e.target.value);
                setAttendees([]);
                setCalendarEvent(null);
              }}
              className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-gray-900 transition-colors bg-transparent appearance-none"
            >
              <option value="">選擇會議室</option>
              {rooms.map((room) => (
                <option key={room.name} value={room.name}>
                  {room.name}
                </option>
              ))}
            </select>

            {loadingCalendar && (
              <p className="text-xs text-gray-400">查詢行事曆中...</p>
            )}

            {calendarEvent && (
              <div className="bg-gray-50 rounded p-3 space-y-1">
                <p className="text-xs text-gray-500">目前會議</p>
                <p className="text-sm font-medium">{calendarEvent.summary}</p>
                <p className="text-xs text-gray-400">
                  {formatTime(calendarEvent.start)} –{" "}
                  {formatTime(calendarEvent.end)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Attendees */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            與會者
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-gray-900 transition-colors bg-transparent"
              placeholder="搜尋姓名或 email..."
            />

            {(searchResults.length > 0 || searching) && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded shadow-sm">
                {searching && (
                  <div className="px-3 py-2 text-xs text-gray-400">
                    搜尋中...
                  </div>
                )}
                {searchResults.map((person) => (
                  <button
                    key={person.email}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => addAttendee(person)}
                  >
                    <span className="font-medium">{person.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">
                      {person.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {attendees.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {attendees.map((a) => (
                <span
                  key={a.email}
                  className="inline-flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1 text-xs"
                >
                  {a.name}
                  <button
                    onClick={() => removeAttendee(a.email)}
                    className="text-gray-300 hover:text-gray-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleStart}
          className="w-full py-2.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors"
        >
          開始會議記錄
        </button>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
          載入中...
        </div>
      }
    >
      <SetupContent />
    </Suspense>
  );
}
