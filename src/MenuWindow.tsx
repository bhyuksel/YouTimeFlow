// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { getCurrentWindow, currentMonitor } from "@tauri-apps/api/window";
import { LogicalSize, PhysicalPosition } from "@tauri-apps/api/dpi";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { readFile } from "@tauri-apps/plugin-fs";
import { Analytics } from "./Analytics";
import { Tasks, Task } from "./Tasks";
import { saveSound, getAllSoundsInfo, getSoundData, deleteSound, AudioItemInfo } from "./utils/audioDB";
import "./App.css";

type TimerMode = "work" | "break";

interface Preset {
  id: string;
  name: string;
  work: number; // in seconds
  break: number; // in seconds
}

const defaultPresets: Preset[] = [
  { id: '1', name: 'Pomodoro', work: 25 * 60, break: 5 * 60 },
  { id: '2', name: 'Derin Odak', work: 50 * 60, break: 10 * 60 },
  { id: '3', name: 'Kısa', work: 15 * 60, break: 5 * 60 },
];



const PREDEFINED_SOUNDS = [
  { id: "/sounds/biraz-molaya.mpeg", name: "Biraz Molaya" },
  { id: "/sounds/bu-kadar-dinlenme-yeter.mpeg", name: "Bu Kadar Dinlenme Yeter" },
  { id: "/sounds/dinlenme-time.mpeg", name: "Dinlenme Time" },
  { id: "/sounds/hadi-projenin-icinden-gecelim.mpeg", name: "Hadi Projenin İçinden Geçelim" },
  { id: "/sounds/ohoo-1.mpeg", name: "Ohoo 1" },
  { id: "/sounds/ohoo-2.mpeg", name: "Ohoo 2" },
  { id: "/sounds/valla-helal-olsun.mpeg", name: "Valla Helal Olsun" },
];

const DigitalTimeInput = ({ label, totalSeconds, onChange }: { label: string, totalSeconds: number, onChange: (s: number) => void }) => {
  const [hStr, setHStr] = useState("");
  const [mStr, setMStr] = useState("");
  const [sStr, setSStr] = useState("");

  useEffect(() => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    // Sadece eğer değerler sayısal olarak farklıysa state'i güncelle (kullanıcının sıfırlarını silmemek için)
    if (parseInt(hStr || "0") !== h) setHStr(h.toString());
    if (parseInt(mStr || "0") !== m) setMStr(m.toString());
    if (parseInt(sStr || "0") !== s) setSStr(s.toString());
  }, [totalSeconds]);

  const handleInput = (val: string, type: 'h'|'m'|'s') => {
    const numStr = val.replace(/[^0-9]/g, '');
    
    let newH = type === 'h' ? numStr : hStr;
    let newM = type === 'm' ? numStr : mStr;
    let newS = type === 's' ? numStr : sStr;

    if (type === 'h') setHStr(newH);
    if (type === 'm') setMStr(newM);
    if (type === 's') setSStr(newS);

    const hNum = parseInt(newH) || 0;
    const mNum = parseInt(newM) || 0;
    const sNum = parseInt(newS) || 0;

    const t = (hNum * 3600) + (mNum * 60) + sNum;
    onChange(t > 0 ? t : 1);
  };

  return (
    <div className="digital-input-container">
      <label className="digital-input-label">{label}</label>
      <div className="digital-clock-inputs">
        <div className="digital-clock-column">
          <span className="digital-clock-col-label">Saat</span>
          <input type="text" inputMode="numeric" value={hStr} onChange={(e) => handleInput(e.target.value, 'h')} />
        </div>
        <span className="colon">.</span>
        <div className="digital-clock-column">
          <span className="digital-clock-col-label">Dakika</span>
          <input type="text" inputMode="numeric" value={mStr} onChange={(e) => handleInput(e.target.value, 'm')} />
        </div>
        <span className="colon">.</span>
        <div className="digital-clock-column">
          <span className="digital-clock-col-label">Saniye</span>
          <input type="text" inputMode="numeric" value={sStr} onChange={(e) => handleInput(e.target.value, 's')} />
        </div>
      </div>
    </div>
  );
};

export default function MenuWindow() {
  const [isClosing, setIsClosing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(170);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(170);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.max(120, Math.min(400, startWidth.current + (e.clientX - startX.current)));
      setSidebarWidth(newWidth);
      if (newWidth > 120) {
        setIsSidebarCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        setIsDraggingSidebar(false);
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Prevent default drag and drop behavior globally to stop the browser from opening dropped files
    const preventDefaultDragDrop = (e: Event) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDefaultDragDrop);
    window.addEventListener('drop', preventDefaultDragDrop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('dragover', preventDefaultDragDrop);
      window.removeEventListener('drop', preventDefaultDragDrop);
    };
  }, []);

  useEffect(() => {
    const onFocus = () => setIsClosing(false);
    window.addEventListener('focus', onFocus);
    
    // Also fallback to listening for an event from App.tsx just in case
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('menu-opened', (event: any) => {
        setIsClosing(false);
        if (event.payload && event.payload.tab) {
          setActiveTab(event.payload.tab);
        }
      });
    });

    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const [mode, setMode] = useState<TimerMode>("work");
  const [isRunning, setIsRunning] = useState(false);
  
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  
  const queryParams = new URLSearchParams(window.location.search);
  const initialTab = (queryParams.get('tab') as 'settings' | 'analytics' | 'tasks') || 'settings';
  const [activeTab, setActiveTab] = useState<'settings' | 'analytics' | 'tasks'>(initialTab);
  
  
  

  const hoverTimeoutRef = useRef<number | null>(null);
  const preMenuPosRef = useRef<PhysicalPosition | null>(null);
  const clampedPosRef = useRef<{x: number, y: number} | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Settings State 
  const getInitialSecs = (newKey: string, oldKey: string, defaultMins: number) => {
    const stored = localStorage.getItem(newKey);
    if (stored) return parseInt(stored);
    const oldStored = localStorage.getItem(oldKey);
    if (oldStored) return parseInt(oldStored) * 60;
    return defaultMins * 60;
  };

  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem("presets");
    return saved ? JSON.parse(saved) : defaultPresets;
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(() => localStorage.getItem("activePresetId") || '1');
  
  const [workTimeSetting, setWorkTimeSetting] = useState(() => getInitialSecs("workTimeSec", "workTime", 25));
  const [breakTimeSetting, setBreakTimeSetting] = useState(() => getInitialSecs("breakTimeSec", "breakTime", 5));
  
  const [hoverDelaySetting, setHoverDelaySetting] = useState(() => parseInt(localStorage.getItem("hoverDelay") || "5"));
  const [minOpacitySetting, setMinOpacitySetting] = useState(() => parseFloat(localStorage.getItem("minOpacity") || "0.6"));
  const [minScaleSetting, setMinScaleSetting] = useState(() => parseFloat(localStorage.getItem("minScale") || "0.6"));
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem("themeColor") || "#3b82f6");
  const [workEndSoundId, setWorkEndSoundId] = useState(() => localStorage.getItem("workEndSoundId") || "chime"); 
  const [breakEndSoundId, setBreakEndSoundId] = useState(() => localStorage.getItem("breakEndSoundId") || "chime"); 
  const [soundLibrary, setSoundLibrary] = useState<AudioItemInfo[]>([]);
  const [pomodoroIcon, setPomodoroIcon] = useState(() => localStorage.getItem("pomodoroIcon") || "🎯"); 
  const [anchorPosition, setAnchorPosition] = useState(() => localStorage.getItem("anchorPosition") || "center center"); 

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => localStorage.getItem("activeTaskId"));
  
  
  
  const [isSoundManagerOpen, setIsSoundManagerOpen] = useState(false);
  const [soundSearchQuery, setSoundSearchQuery] = useState('');
  
  const [soundPickerTarget, setSoundPickerTarget] = useState<'work' | 'break' | null>(null);

  const getSoundName = (id: string) => {
    if (id === 'chime') return 'Çan (Chime)';
    if (id === 'beep') return 'Bip (Beep)';
    if (id === 'bell') return 'Zil (Soft Bell)';
    
    const predefined = PREDEFINED_SOUNDS.find(s => s.id === id);
    if (predefined) return predefined.name;
    
    const library = soundLibrary.find(s => s.id === id);
    if (library) return library.name;
    
    return 'Bilinmeyen Ses';
  };

  const [timeLeft, setTimeLeft] = useState(workTimeSetting);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    
    // Load sound library on startup
    getAllSoundsInfo().then(info => setSoundLibrary(info)).catch(console.error);

    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Listen for storage events from App.tsx (e.g. task completed)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tasks') {
        const savedTasks = localStorage.getItem("tasks");
        if (savedTasks) setTasks(JSON.parse(savedTasks));
      } else if (e.key === 'activeTaskId') {
        setActiveTaskId(localStorage.getItem("activeTaskId"));
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const fetchUsage = async () => {
      if (activeTab !== 'analytics') return;
      
      try {
        const activeApp: string | null = await invoke("get_current_app");
        const usageData: any = await invoke("get_usage_data");
        const today = new Date().toISOString().split("T")[0];
        const todayUsage = usageData.daily_usage[today] || {};
        
        // ... (rest of logic)
      } catch (e) {
        console.error("Usage fetch error:", e);
      }
    };
    fetchUsage();
    const usageInterval = window.setInterval(fetchUsage, 1000);
    return () => clearInterval(usageInterval);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("anchorPosition", anchorPosition);
  }, [anchorPosition]);

  // alarmType removed

  useEffect(() => {
    localStorage.setItem("pomodoroIcon", pomodoroIcon);
  }, [pomodoroIcon]);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (activeTaskId) localStorage.setItem("activeTaskId", activeTaskId);
    else localStorage.removeItem("activeTaskId");
  }, [activeTaskId]);

  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      const soundId = mode === "work" ? workEndSoundId : breakEndSoundId;
      playAlarm(soundId);
      
      if (mode === "work") {
        setMode("break");
        setTimeLeft(breakTimeSetting);
        if (activeTaskId) {
          setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, pomodorosSpent: t.pomodorosSpent + 1 } : t));
        }
      } else {
        setMode("work");
        setTimeLeft(workTimeSetting);
      }
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, workTimeSetting, breakTimeSetting, workEndSoundId, breakEndSoundId]);

  useEffect(() => {
    const handleSoundDropped = async () => {
      const updatedLibrary = await getAllSoundsInfo();
      setSoundLibrary(updatedLibrary);
    };
    window.addEventListener('tauri-sound-dropped', handleSoundDropped);
    return () => window.removeEventListener('tauri-sound-dropped', handleSoundDropped);
  }, []);

  const playAlarm = async (soundId: string) => {
    if (["chime", "beep", "bell"].includes(soundId)) {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      
      if (soundId === "chime") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 1);
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        osc.start(now);
        osc.stop(now + 1.5);
      } else if (soundId === "beep") {
        osc.type = "square";
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.setValueAtTime(0, now + 0.15);
        gain.gain.setValueAtTime(0.3, now + 0.3);
        gain.gain.setValueAtTime(0, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (soundId === "bell") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1046.50, now); // C6
        osc.frequency.exponentialRampToValueAtTime(1396.91, now + 0.1); // F6
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
        osc.start(now);
        osc.stop(now + 2);
      }
      return;
    }

    // It's a static file
    if (soundId.startsWith("/sounds/")) {
      if (audioRef.current) {
        audioRef.current.src = soundId;
        audioRef.current.play().catch(e => console.error("Play failed:", e));
      }
      return;
    }

    // It's a custom sound from IndexedDB
    try {
      const data = await getSoundData(soundId);
      if (data && audioRef.current) {
        audioRef.current.src = data;
        audioRef.current.play().catch(e => console.error("Play failed:", e));
      }
    } catch (e) {
      console.error("Failed to load custom sound:", e);
    }
  };



  const changeWindowSize = async (logicalWidth: number, logicalHeight: number, behavior: "snap" | "center" | "in-place" = "snap") => {
    try {
      const monitor = await currentMonitor();
      if (!monitor) {
        await appWindow.setSize(new LogicalSize(logicalWidth, logicalHeight));
        return;
      }
      
      const scaleFactor = monitor.scaleFactor;
      const physWidth = Math.round(logicalWidth * scaleFactor);
      const physHeight = Math.round(logicalHeight * scaleFactor);
      
      if (behavior === "in-place") {
        const currentPos = await appWindow.outerPosition();
        let targetX = currentPos.x;
        let targetY = currentPos.y;

        if (logicalWidth > 300) {
          // We are expanding to the menu
          preMenuPosRef.current = currentPos;
          
          if (targetX + physWidth > monitor.position.x + monitor.size.width) {
            targetX = monitor.position.x + monitor.size.width - physWidth;
          }
          if (targetY + physHeight > monitor.position.y + monitor.size.height) {
            targetY = monitor.position.y + monitor.size.height - physHeight;
          }
          if (targetX < monitor.position.x) targetX = monitor.position.x;
          if (targetY < monitor.position.y) targetY = monitor.position.y;
          
          clampedPosRef.current = { x: targetX, y: targetY };
        } else {
          // We are shrinking back to the timer
          if (preMenuPosRef.current && clampedPosRef.current) {
            // If the window hasn't been dragged (it's still exactly where we clamped it)
            if (currentPos.x === clampedPosRef.current.x && currentPos.y === clampedPosRef.current.y) {
              targetX = preMenuPosRef.current.x;
              targetY = preMenuPosRef.current.y;
            }
          }
          preMenuPosRef.current = null;
          clampedPosRef.current = null;
        }

        // Only call setPosition if the window actually needs to move
        // This completely eliminates flickers!
        if (targetX !== currentPos.x || targetY !== currentPos.y) {
          await appWindow.setPosition(new PhysicalPosition(targetX, targetY));
        }
        await appWindow.setSize(new LogicalSize(logicalWidth, logicalHeight));
        return;
      }

      await appWindow.setSize(new LogicalSize(logicalWidth, logicalHeight));
      
      if (anchorPosition === "center center" || behavior === "center") {
        await appWindow.center();
        return;
      }
      
      let targetX = monitor.position.x;
      let targetY = monitor.position.y;
      
      if (anchorPosition.includes("right")) {
         targetX += monitor.size.width - physWidth;
      } else if (anchorPosition.includes("center")) {
         targetX += Math.round((monitor.size.width - physWidth) / 2);
      }
      
      if (anchorPosition.includes("bottom")) {
         targetY += monitor.size.height - physHeight;
      }
      
      await appWindow.setPosition(new PhysicalPosition(targetX, targetY));
    } catch (err) {
      console.error("Failed to change window size:", err);
    }
  };








  const isAudioFile = (file: File) => {
    if (file.type.startsWith('audio/')) return true;
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm', '.mpeg', '.mpg', '.mp4'];
    return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && isAudioFile(file)) {
        if (soundLibrary.some(s => s.name === file.name)) {
          console.warn(`File ${file.name} is already in the library.`);
          continue;
        }

        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            if (base64) {
              const newId = Date.now().toString() + "-" + i;
              await saveSound(newId, file.name, base64);
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    }
    
    const updatedLibrary = await getAllSoundsInfo();
    setSoundLibrary(updatedLibrary);
  };

  useEffect(() => {
    let unlistenPromise: Promise<() => void> | null = null;
    let isCancelled = false;

    const setupNativeDragDrop = async () => {
      try {
        const { getCurrentWebview } = await import('@tauri-apps/api/webview');
        unlistenPromise = getCurrentWebview().onDragDropEvent(async (event) => {
          
          if (event.payload.type === 'over') {
            setIsDragActive(true);
          } else if (event.payload.type === 'leave') {
            setIsDragActive(false);
          } else if (event.payload.type === 'drop') {
            setIsDragActive(false);
            const paths = event.payload.paths;
            if (!paths || paths.length === 0) return;
            
            const currentLibrary = await getAllSoundsInfo();
            
            for (let i = 0; i < paths.length; i++) {
              const path = paths[i];
              const name = path.split(/[/\\]/).pop() || 'Unknown';
              const ext = name.split('.').pop()?.toLowerCase();
              if (ext === 'mp3' || ext === 'wav' || ext === 'ogg' || ext === 'aac' || ext === 'm4a' || ext === 'flac' || ext === 'webm' || ext === 'mpeg' || ext === 'mpg' || ext === 'mp4') {
                if (currentLibrary.some(s => s.name === name)) {
                  continue;
                }
                
                try {
                  const bytes = await readFile(path);
                  
                  let mime = 'audio/mpeg';
                  if (ext === 'wav') mime = 'audio/wav';
                  else if (ext === 'ogg') mime = 'audio/ogg';
                  else if (ext === 'aac') mime = 'audio/aac';
                  else if (ext === 'm4a' || ext === 'mp4') mime = 'audio/mp4';
                  else if (ext === 'flac') mime = 'audio/flac';
                  else if (ext === 'webm') mime = 'audio/webm';

                  await new Promise<void>((resolve) => {
                    const blob = new Blob([bytes], { type: mime });
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      const dataUrl = ev.target?.result as string;
                      if (dataUrl) {
                        const newId = Date.now().toString() + "-" + i;
                        await saveSound(newId, name, dataUrl);
                      }
                      resolve();
                    };
                    reader.readAsDataURL(blob);
                  });
                } catch (err: any) {
                  console.error("Failed to read dropped file natively:", err);
                }
              } else {
              }
            }
            const updatedLibrary = await getAllSoundsInfo();
            setSoundLibrary(updatedLibrary);
          }
        });

        const unlisten = await unlistenPromise;
        if (isCancelled) unlisten();
      } catch (err: any) {
        console.warn("Native drag drop setup failed:", err);
      }
    };
    setupNativeDragDrop();
    return () => {
      isCancelled = true;
      if (unlistenPromise) {
        unlistenPromise.then(unlisten => unlisten());
      }
    };
  }, []);

  const handleAudioDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    let processed = false;

    const files = e.dataTransfer.files;
    
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file && isAudioFile(file)) {
          if (soundLibrary.some(s => s.name === file.name)) {
            console.warn(`File ${file.name} is already in the library.`);
            continue;
          }

          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const base64 = event.target?.result as string;
              if (base64) {
                const newId = Date.now().toString() + "-" + i;
                await saveSound(newId, file.name, base64);
                processed = true;
              }
              resolve();
            };
            reader.readAsDataURL(file);
          });
        }
      }
    } else {
      // Fallback for Linux WebKitGTK where e.dataTransfer.files might be empty
      // but the file paths are provided in text/uri-list
      const uriList = e.dataTransfer.getData('text/uri-list');
      if (uriList) {
        const paths = uriList.split('\n').filter(line => line.startsWith('file://')).map(line => decodeURIComponent(line.replace('file://', '').trim()));
        for (let i = 0; i < paths.length; i++) {
          const path = paths[i];
          const name = path.split(/[/\\]/).pop() || 'Unknown';
          const ext = name.split('.').pop()?.toLowerCase();
          
          if (ext && ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'webm', 'mpeg', 'mpg', 'mp4'].includes(ext)) {
            if (soundLibrary.some(s => s.name === name)) continue;
            
            try {
              const { readFile } = await import('@tauri-apps/plugin-fs');
              const bytes = await readFile(path);
              
              let mime = 'audio/mpeg';
              if (ext === 'wav') mime = 'audio/wav';
              else if (ext === 'ogg') mime = 'audio/ogg';
              else if (ext === 'aac') mime = 'audio/aac';
              else if (ext === 'm4a' || ext === 'mp4') mime = 'audio/mp4';
              else if (ext === 'flac') mime = 'audio/flac';
              else if (ext === 'webm') mime = 'audio/webm';

              await new Promise<void>((resolve) => {
                const blob = new Blob([bytes], { type: mime });
                const reader = new FileReader();
                reader.onload = async (ev) => {
                  const dataUrl = ev.target?.result as string;
                  if (dataUrl) {
                    const newId = Date.now().toString() + "-" + i + "-uri";
                    await saveSound(newId, name, dataUrl);
                    processed = true;
                  }
                  resolve();
                };
                reader.readAsDataURL(blob);
              });
            } catch (err: any) {
              console.error("Failed to read dropped file natively via uri-list:", err);
            }
          } else {
          }
        }
      } else {
         const types = e.dataTransfer.types;
      }
    }
    
    if (processed) {
      const updatedLibrary = await getAllSoundsInfo();
      setSoundLibrary(updatedLibrary);
    }
  };

  const handleDeleteSound = async (id: string) => {
    await deleteSound(id);
    const updatedLibrary = await getAllSoundsInfo();
    setSoundLibrary(updatedLibrary);
    if (workEndSoundId === id) setWorkEndSoundId("chime");
    if (breakEndSoundId === id) setBreakEndSoundId("chime");
  };

  const handlePreviewSound = (id: string) => {
    playAlarm(id);
  };

  const handleWorkTimeChange = (newSec: number) => {
    setWorkTimeSetting(newSec);
    if (activePresetId) {
      setPresets(prev => prev.map(p => p.id === activePresetId ? { ...p, work: newSec } : p));
    }
  };

  const handleBreakTimeChange = (newSec: number) => {
    setBreakTimeSetting(newSec);
    if (activePresetId) {
      setPresets(prev => prev.map(p => p.id === activePresetId ? { ...p, break: newSec } : p));
    }
  };

  const selectPreset = (p: Preset) => {
    setActivePresetId(p.id);
    setWorkTimeSetting(p.work);
    setBreakTimeSetting(p.break);
  };

  const addPreset = () => {
    const newPreset = { id: Date.now().toString(), name: "Yeni Mod", work: workTimeSetting, break: breakTimeSetting };
    setPresets([...presets, newPreset]);
    setActivePresetId(newPreset.id);
    setEditingPresetId(newPreset.id);
  };

  const deletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = presets.filter(p => p.id !== id);
    setPresets(filtered);
    if (activePresetId === id && filtered.length > 0) {
      selectPreset(filtered[0]);
    } else if (filtered.length === 0) {
      setActivePresetId(null);
    }
  };

  const renamePreset = (id: string, newName: string) => {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("workTimeSec", workTimeSetting.toString());
    localStorage.setItem("breakTimeSec", breakTimeSetting.toString());
    localStorage.setItem("hoverDelay", hoverDelaySetting.toString());
    localStorage.setItem("minOpacity", minOpacitySetting.toString());
    localStorage.setItem("minScale", minScaleSetting.toString());
    localStorage.setItem("presets", JSON.stringify(presets));
    if (activePresetId) localStorage.setItem("activePresetId", activePresetId);
    
    // Save theme and sounds
    localStorage.setItem("themeColor", themeColor);
    localStorage.setItem("workEndSoundId", workEndSoundId);
    localStorage.setItem("breakEndSoundId", breakEndSoundId);
    localStorage.setItem("pomodoroIcon", pomodoroIcon);
    localStorage.setItem("anchorPosition", anchorPosition);
    
    // Trigger storage event so App.tsx knows settings changed
    localStorage.setItem('settingsChanged', Date.now().toString());
    
    setIsClosing(true);
    setTimeout(() => {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        getCurrentWindow().hide();
      });
    }, 250);
  };

  const cancelSettings = async () => {
    setIsClosing(true);
    setTimeout(() => {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        getCurrentWindow().hide();
      });
    }, 250);
  };

  const formatTime = (seconds: number, includeHours: boolean = false) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (includeHours || h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const hasHours = (mode === "work" ? workTimeSetting : breakTimeSetting) >= 3600;
  const timeStr = formatTime(timeLeft, hasHours);



  

  return (
    <div className={`app-container menu-open ${isClosing ? 'teleporting' : ''}`} data-theme={themeColor} style={{ '--primary': themeColor } as React.CSSProperties}>
      <audio ref={audioRef} preload="auto" />

      <div className="unified-menu">
        <button 
          className="window-close-btn" 
          onClick={cancelSettings}
          title="Kapat"
        >
          ✕
        </button>
            <div 
              className={`menu-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isDraggingSidebar ? 'resizing' : ''}`} 
              style={{ width: isSidebarCollapsed ? 60 : sidebarWidth, flexShrink: 0 }}
              onPointerDown={(e) => { 
                if (e.buttons === 1 && !(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('.sidebar-resizer')) {
                  appWindow.startDragging(); 
                }
              }}
            >
              {!isSidebarCollapsed && (
                <div 
                  className="sidebar-resizer"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    isResizing.current = true;
                    setIsDraggingSidebar(true);
                    startX.current = e.clientX;
                    startWidth.current = sidebarWidth;
                    document.body.style.cursor = 'col-resize';
                  }}
                />
              )}
              <div className="menu-drag-area"></div>
              <div className="menu-app-brand">
                <button 
                  className="sidebar-collapse-btn" 
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  title={isSidebarCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>
                <div className="brand-text">
                  <span className="brand-letter y">Y</span><span className="brand-rest">ou</span>
                  <span className="brand-letter t">T</span><span className="brand-rest">ime</span>
                  <span className="brand-letter f">F</span><span className="brand-rest">low</span>
                </div>
              </div>
              <div className="menu-tabs">
                <button 
                  className={`menu-tab ${activeTab === 'settings' ? 'active' : ''}`}
                  onPointerDown={(e) => { e.stopPropagation(); setActiveTab('settings'); }}
                  title="Ayarlar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>Ayarlar</span>
                </button>
                <button 
                  className={`menu-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                  onPointerDown={(e) => { e.stopPropagation(); setActiveTab('analytics'); }}
                  title="İstatistikler"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect width="4" height="7" x="7" y="14" rx="1"/><rect width="4" height="12" x="15" y="9" rx="1"/></svg>
                  <span>İstatistikler</span>
                </button>
                <button 
                  className={`menu-tab ${activeTab === 'tasks' ? 'active' : ''}`}
                  onPointerDown={(e) => { e.stopPropagation(); setActiveTab('tasks'); }}
                  title="Görevler"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  <span>Görevler</span>
                </button>
              </div>
            </div>
            
            <div className="menu-content-area">
              <div className="menu-content-drag-handle" onPointerDown={(e) => { if (e.buttons === 1) appWindow.startDragging(); }}></div>
              {activeTab === 'settings' && (
                <form className="settings-form" onSubmit={saveSettings}>
                  <div className="settings-scroll-area">
                    <div className="setting-group preset-group">
                      <div className="setting-group-title">Hızlı Modlar (Ön Ayarlar)</div>
                      <div className="preset-chips">
                        {presets.map(p => (
                          <div 
                            key={p.id} 
                            className={`preset-chip ${activePresetId === p.id ? 'active' : ''}`}
                            onClick={() => selectPreset(p)}
                            onDoubleClick={() => setEditingPresetId(p.id)}
                          >
                            {editingPresetId === p.id ? (
                              <input 
                                type="text" 
                                autoFocus
                                value={p.name}
                                onChange={(e) => renamePreset(p.id, e.target.value)}
                                onBlur={() => setEditingPresetId(null)}
                                onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); setEditingPresetId(null); } }}
                              />
                            ) : (
                              <span>{p.name}</span>
                            )}
                            {activePresetId === p.id && presets.length > 1 && (
                               <span className="preset-delete" onClick={(e) => deletePreset(p.id, e)}>×</span>
                            )}
                          </div>
                        ))}
                        <div className="preset-chip new-preset" onClick={addPreset}>+ Ekle</div>
                      </div>
                      <p className="preset-hint">* İsim değiştirmek için çift tıklayın, süreler alttan değiştiğinde otomatik güncellenir.</p>
                    </div>

                    <div className="setting-group">
                      <div className="setting-group-title">Süreler (HH:MM:SS)</div>
                      <div className="timers-container">
                        <DigitalTimeInput label="Çalışma" totalSeconds={workTimeSetting} onChange={handleWorkTimeChange} />
                        <DigitalTimeInput label="Mola" totalSeconds={breakTimeSetting} onChange={handleBreakTimeChange} />
                      </div>
                    </div>

                    <div className="setting-group">
                      <div className="setting-group-title">Görünüm & Davranış</div>
                      
                      <div className="preview-canvas">
                          <div 
                            className="app-container minimized preview-replica"
                            style={{
                              '--minimized-opacity': minOpacitySetting,
                              '--minimized-scale': minScaleSetting,
                              '--primary': themeColor,
                              '--anchor-origin': 'center center',
                              margin: '0 auto',
                              position: 'relative'
                            } as React.CSSProperties}
                          >
                            <div className="content">
                              <div className="timer-display">
                                <h1 className={`glow-text ${hasHours ? 'long-text' : ''}`}>{timeStr}</h1>
                              </div>
                            </div>
                          </div>
                      </div>

                      <div className="modern-settings-grid">
                        <div className="modern-setting-card">
                          <label>Tema Rengi</label>
                          <div className="color-picker-wrapper">
                            <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
                            <div className="color-display" style={{backgroundColor: themeColor}}></div>
                            <span>{themeColor.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="modern-setting-card">
                          <label>Gizlenme Süresi</label>
                          <div className="number-input-modern">
                            <input 
                              type="text" 
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={hoverDelaySetting === 0 ? '' : hoverDelaySetting} 
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                if (val === '') {
                                  setHoverDelaySetting(0);
                                  return;
                                }
                                let num = parseInt(val, 10);
                                if (num > 10) num = 10;
                                setHoverDelaySetting(num);
                              }}
                              onBlur={() => {
                                if (hoverDelaySetting < 1) setHoverDelaySetting(1);
                              }}
                            />
                            <span>sn</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="modern-sliders-section">
                        <div className="modern-slider-row">
                          <div className="slider-label">
                            <span>Saydamlık</span>
                            <span>{Math.round(minOpacitySetting * 100)}%</span>
                          </div>
                          <input type="range" className="styled-slider" min="0.1" max="1" step="0.1" value={minOpacitySetting} onChange={(e) => setMinOpacitySetting(Number(e.target.value))} style={{ '--slider-color': themeColor } as React.CSSProperties} />
                        </div>
                        
                        <div className="modern-slider-row">
                          <div className="slider-label">
                            <span>Küçülme Oranı</span>
                            <span>{Math.round(minScaleSetting * 100)}%</span>
                          </div>
                          <input type="range" className="styled-slider" min="0.3" max="1" step="0.1" value={minScaleSetting} onChange={(e) => setMinScaleSetting(Number(e.target.value))} style={{ '--slider-color': themeColor } as React.CSSProperties} />
                        </div>
                      </div>

                      <div className="modern-anchor-section">
                        <label>Küçülme Yönü (Ekran Köşesi)</label>
                        <div className="anchor-grid-modern">
                          {[
                            {val: "top left", label: "↖"}, {val: "top center", label: "↑"}, {val: "top right", label: "↗"},
                            {val: "center left", label: "←"}, {val: "center center", label: "•"}, {val: "center right", label: "→"},
                            {val: "bottom left", label: "↙"}, {val: "bottom center", label: "↓"}, {val: "bottom right", label: "↘"}
                          ].map(pos => (
                            <button 
                              key={pos.val} 
                              type="button" 
                              className={`anchor-btn ${anchorPosition === pos.val || (pos.val === 'center center' && !anchorPosition.includes('top') && !anchorPosition.includes('bottom') && !anchorPosition.includes('left') && !anchorPosition.includes('right')) ? 'active' : ''}`}
                              onClick={() => setAnchorPosition(pos.val)}
                              style={anchorPosition === pos.val || (pos.val === 'center center' && anchorPosition === 'center center') ? { backgroundColor: themeColor, borderColor: themeColor, boxShadow: `0 0 10px ${themeColor}60` } : {}}
                              title={pos.val}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="setting-group">
                      <div className="setting-group-title">Ses Kütüphanesi & Alarmlar</div>
                      
                      <div className="setting-row">
                        <label>Çalışma Bitiş Sesi:</label>
                        <button 
                          type="button"
                          className="sound-picker-btn"
                          onClick={() => setSoundPickerTarget('work')}
                        >
                          <span className="sound-picker-name">{getSoundName(workEndSoundId)}</span>
                          <span className="sound-picker-arrow">▼</span>
                        </button>
                      </div>

                      <div className="setting-row">
                        <label>Mola Bitiş Sesi:</label>
                        <button 
                          type="button"
                          className="sound-picker-btn"
                          onClick={() => setSoundPickerTarget('break')}
                        >
                          <span className="sound-picker-name">{getSoundName(breakEndSoundId)}</span>
                          <span className="sound-picker-arrow">▼</span>
                        </button>
                      </div>

                      <label 
                        className={`drag-drop-zone ${isDragActive ? 'drag-active' : ''}`}
                        style={{ cursor: 'pointer', display: 'block' }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
                        onDrop={(e) => { setIsDragActive(false); handleAudioDrop(e); }}
                      >
                        <div className="drag-drop-content">
                          <span className="drag-icon">🎵</span>
                          <p>Yeni ses dosyası yüklemek için <strong>sürükleyip bırakın</strong> (Çoklu Seçim)</p>
                          <p className="drag-hint">veya</p>
                          <span className="audio-upload-label">
                            Bilgisayardan Seç
                            <input type="file" accept="audio/*,video/mp4,video/mpeg,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,.mpeg,.mpg,.mp4" multiple onChange={handleAudioUpload} hidden />
                          </span>
                        </div>
                      </label>

                      {soundLibrary.length > 0 && (
                        <button 
                          type="button" 
                          className="manage-sounds-btn" 
                          onClick={() => setIsSoundManagerOpen(true)}
                        >
                          🎵 Yüklü Sesleri Yönet ({soundLibrary.length})
                        </button>
                      )}
                    </div>

                    <div className="setting-group">
                      <div className="setting-group-title">Görevler</div>
                      <div className="setting-row">
                        <label>Görev İkonu (Pomodoro):</label>
                        <select 
                          value={pomodoroIcon} 
                          onChange={(e) => setPomodoroIcon(e.target.value)}
                        >
                          <option value="🍅">🍅 Domates</option>
                          <option value="⚡">⚡ Yıldırım</option>
                          <option value="☕">☕ Kahve</option>
                          <option value="🧠">🧠 Beyin</option>
                          <option value="⏳">⏳ Kum Saati</option>
                          <option value="🎯">🎯 Hedef</option>
                          <option value="💎">💎 Elmas</option>
                          <option value="✨">✨ Yıldız</option>
                          <option value="🌸">🌸 Kiraz Çiçeği</option>
                          <option value="🌻">🌻 Ayçiçeği</option>
                          <option value="🌷">🌷 Lale</option>
                          <option value="🌹">🌹 Gül</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="settings-controls">
                    <button type="button" className="cancel-btn" onClick={cancelSettings}>İptal</button>
                    <button type="submit" className="save-btn">Kaydet</button>
                  </div>
                </form>
              )}
              {activeTab === 'analytics' && (
                <div className="analytics-tab-wrapper">
                  <Analytics />
                </div>
              )}
              {activeTab === 'tasks' && (
                <div className="tasks-tab-wrapper" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Tasks 
                    tasks={tasks} 
                    setTasks={setTasks} 
                    activeTaskId={activeTaskId} 
                    setActiveTaskId={setActiveTaskId} 
                    themeColor={themeColor} 
                    pomodoroIcon={pomodoroIcon}
                  />
                </div>
              )}
            </div>
          </div>
      {soundPickerTarget && (
        <div className="sound-manager-overlay" onClick={() => setSoundPickerTarget(null)}>
          <div className="sound-manager-modal" onClick={e => e.stopPropagation()}>
            <div className="sound-manager-header">
              <h3>{soundPickerTarget === 'work' ? 'Çalışma Bitiş Sesi' : 'Mola Bitiş Sesi'} Seç</h3>
              <button className="close-btn" onClick={() => setSoundPickerTarget(null)}>✕</button>
            </div>
            
            <div className="sound-manager-list sound-picker-list">
              <div className="sound-category-title">Sistem Sesleri</div>
              {[
                { id: 'chime', name: 'Çan (Chime)' },
                { id: 'beep', name: 'Bip (Beep)' },
                { id: 'bell', name: 'Zil (Soft Bell)' }
              ].map(sound => (
                <div 
                  key={sound.id} 
                  className={`sound-list-item ${(soundPickerTarget === 'work' ? workEndSoundId : breakEndSoundId) === sound.id ? 'selected' : ''}`}
                  onClick={() => {
                    if (soundPickerTarget === 'work') setWorkEndSoundId(sound.id);
                    else setBreakEndSoundId(sound.id);
                    playAlarm(sound.id);
                    setSoundPickerTarget(null);
                  }}
                >
                  <span className="sound-name">{sound.name}</span>
                  {(soundPickerTarget === 'work' ? workEndSoundId : breakEndSoundId) === sound.id && <span className="check-icon">✓</span>}
                </div>
              ))}

              <div className="sound-category-title">Gömülü Sesler</div>
              {PREDEFINED_SOUNDS.map(sound => (
                <div 
                  key={sound.id} 
                  className={`sound-list-item ${(soundPickerTarget === 'work' ? workEndSoundId : breakEndSoundId) === sound.id ? 'selected' : ''}`}
                  onClick={() => {
                    if (soundPickerTarget === 'work') setWorkEndSoundId(sound.id);
                    else setBreakEndSoundId(sound.id);
                    playAlarm(sound.id);
                    setSoundPickerTarget(null);
                  }}
                >
                  <span className="sound-name">{sound.name}</span>
                  {(soundPickerTarget === 'work' ? workEndSoundId : breakEndSoundId) === sound.id && <span className="check-icon">✓</span>}
                </div>
              ))}

              {soundLibrary.length > 0 && (
                <>
                  <div className="sound-category-title">Yüklenen Sesler</div>
                  {soundLibrary.map(sound => (
                    <div 
                      key={sound.id} 
                      className={`sound-list-item ${(soundPickerTarget === 'work' ? workEndSoundId : breakEndSoundId) === sound.id ? 'selected' : ''}`}
                      onClick={() => {
                        if (soundPickerTarget === 'work') setWorkEndSoundId(sound.id);
                        else setBreakEndSoundId(sound.id);
                        playAlarm(sound.id);
                        setSoundPickerTarget(null);
                      }}
                    >
                      <span className="sound-name" title={sound.name}>{sound.name}</span>
                      {(soundPickerTarget === 'work' ? workEndSoundId : breakEndSoundId) === sound.id && <span className="check-icon">✓</span>}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isSoundManagerOpen && (
        <div className="sound-manager-overlay" onClick={() => setIsSoundManagerOpen(false)}>
          <div className="sound-manager-modal" onClick={e => e.stopPropagation()}>
            <div className="sound-manager-header">
              <h3>Ses Kütüphanesi</h3>
              <button className="close-btn" onClick={() => setIsSoundManagerOpen(false)}>✕</button>
            </div>
            <div className="sound-manager-search">
              <input 
                type="text" 
                placeholder="Ses ara..." 
                value={soundSearchQuery} 
                onChange={(e) => setSoundSearchQuery(e.target.value)} 
              />
            </div>
            <div className="sound-manager-list">
              {soundLibrary.filter(s => s.name.toLowerCase().includes(soundSearchQuery.toLowerCase())).map(sound => (
                <div key={sound.id} className="sound-list-item">
                  <span className="sound-name" title={sound.name}>{sound.name}</span>
                  <div className="sound-actions">
                    <button type="button" className="sound-play-btn" onClick={() => handlePreviewSound(sound.id)}>▶</button>
                    <button type="button" className="sound-delete-btn" onClick={() => handleDeleteSound(sound.id)}>✕</button>
                  </div>
                </div>
              ))}
              {soundLibrary.filter(s => s.name.toLowerCase().includes(soundSearchQuery.toLowerCase())).length === 0 && (
                <div className="no-sounds">Sonuç bulunamadı.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} />
    </div>
  );
}


