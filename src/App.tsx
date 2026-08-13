import { useState, useEffect, useRef } from "react";
import { getCurrentWindow, currentMonitor } from "@tauri-apps/api/window";
import { LogicalSize, PhysicalPosition } from "@tauri-apps/api/dpi";
import { invoke } from "@tauri-apps/api/core";
import { Analytics } from "./Analytics";
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

function App() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [isRunning, setIsRunning] = useState(false);
  const [isHovered, setIsHovered] = useState(true);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [isTeleporting, setIsTeleporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'analytics'>('settings');
  const [mainView, setMainView] = useState<'timer' | 'analytics'>('timer');
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const [currentAppSeconds, setCurrentAppSeconds] = useState(0);

  const hoverTimeoutRef = useRef<number | null>(null);
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
  const [alarmType, setAlarmType] = useState(() => localStorage.getItem("alarmType") || "chime"); 
  const [anchorPosition, setAnchorPosition] = useState(() => localStorage.getItem("anchorPosition") || "center center"); 

  const [timeLeft, setTimeLeft] = useState(workTimeSetting);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    handleMouseLeave();
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchUsage = async () => {
      if (mainView !== 'analytics') return;
      
      try {
        const activeApp: string | null = await invoke("get_current_app");
        const usageData: any = await invoke("get_usage_data");
        const today = new Date().toISOString().split("T")[0];
        const todayUsage = usageData.daily_usage[today] || {};
        
        if (activeApp) {
          setCurrentApp(activeApp);
          setCurrentAppSeconds(todayUsage[activeApp] || 0);
        } else {
          setCurrentApp(null);
          setCurrentAppSeconds(0);
        }
      } catch (e) {
        console.error("Usage fetch error:", e);
      }
    };
    fetchUsage();
    const usageInterval = window.setInterval(fetchUsage, 1000);
    return () => clearInterval(usageInterval);
  }, [mainView]);

  useEffect(() => {
    localStorage.setItem("anchorPosition", anchorPosition);
  }, [anchorPosition]);

  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      playAlarm(alarmType);
      if (mode === "work") {
        setMode("break");
        setTimeLeft(breakTimeSetting);
      } else {
        setMode("work");
        setTimeLeft(workTimeSetting);
      }
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, workTimeSetting, breakTimeSetting, alarmType]);

  const playAlarm = (type: string) => {
    if (type === "custom") {
      if (audioRef.current) audioRef.current.play().catch(e => console.error("Play failed:", e));
      return;
    }

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
    
    if (type === "chime") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 1);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      osc.start(now);
      osc.stop(now + 1.5);
    } else if (type === "beep") {
      osc.type = "square";
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.setValueAtTime(0, now + 0.15);
      gain.gain.setValueAtTime(0.3, now + 0.3);
      gain.gain.setValueAtTime(0, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === "bell") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1046.50, now); // C6
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
      osc.start(now);
      osc.stop(now + 2);
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
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
        const currentSize = await appWindow.outerSize();
        
        const centerX = currentPos.x + currentSize.width / 2;
        const centerY = currentPos.y + currentSize.height / 2;
        
        let targetX = Math.round(centerX - physWidth / 2);
        let targetY = Math.round(centerY - physHeight / 2);
        
        // Prevent overflow off the active monitor
        if (targetX < monitor.position.x) targetX = monitor.position.x;
        if (targetY < monitor.position.y) targetY = monitor.position.y;
        if (targetX + physWidth > monitor.position.x + monitor.size.width) targetX = monitor.position.x + monitor.size.width - physWidth;
        if (targetY + physHeight > monitor.position.y + monitor.size.height) targetY = monitor.position.y + monitor.size.height - physHeight;

        await appWindow.setSize(new LogicalSize(logicalWidth, logicalHeight));
        await appWindow.setPosition(new PhysicalPosition(targetX, targetY));
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

  const snapWindowToAnchor = async () => {
    if (anchorPosition === "center center") return false;
    
    try {
      const monitor = await currentMonitor();
      if (!monitor) return false;
      
      const size = await appWindow.outerSize();
      const startPos = await appWindow.outerPosition();
      
      let targetX = monitor.position.x;
      let targetY = monitor.position.y;
      
      if (anchorPosition.includes("right")) {
         targetX += monitor.size.width - size.width;
      } else if (anchorPosition.includes("center") && !anchorPosition.includes("center center")) {
         targetX += (monitor.size.width - size.width) / 2;
      }
      
      if (anchorPosition.includes("bottom")) {
         targetY += monitor.size.height - size.height;
      }
      
      if (startPos.x === targetX && startPos.y === targetY) {
         // Zaten hedefe ulaştıysa teleport yapma
         return false;
      }
      
      await appWindow.setPosition(new PhysicalPosition(targetX, targetY));
      return true;
    } catch (err) {
      console.error("Failed to snap window:", err);
      return false;
    }
  };

  const handleMouseLeave = (force: boolean = false) => {
    if (isMenuOpen && !force) return; 
    
    hoverTimeoutRef.current = window.setTimeout(async () => {
      if (anchorPosition === "center center") {
        setIsHovered(false);
        return;
      }

      // 1. Durumu kontrol et ve fade out (görünmez) yap
      setIsTeleporting(true);
      
      // 2. CSS Fade-out animasyonunun bitmesini bekle (200ms)
      setTimeout(async () => {
         const didTeleport = await snapWindowToAnchor();
         
         // 3. Işınlandıktan sonra tekrar görünür yap ve küçül
         if (didTeleport) {
            setIsHovered(false);
         } else {
            // Eğer ışınlanmadıysa (zaten oradaysa), sadece küçül.
            setIsHovered(false);
         }
         setIsTeleporting(false); 
      }, 200);

    }, hoverDelaySetting * 1000);
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setMode("work");
    setTimeLeft(workTimeSetting);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && audioRef.current) {
      audioRef.current.src = URL.createObjectURL(file);
      setAlarmType("custom");
    }
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
    localStorage.setItem("themeColor", themeColor);
    localStorage.setItem("alarmType", alarmType);
    localStorage.setItem("presets", JSON.stringify(presets));
    if (activePresetId) localStorage.setItem("activePresetId", activePresetId);
    
    if (!isRunning) {
      setTimeLeft(mode === "work" ? workTimeSetting : breakTimeSetting);
    }
    
    await changeWindowSize(300, 150);
    
    await changeWindowSize(300, 150);
    
    setIsMenuOpen(false);
    setEditingPresetId(null);
    handleMouseLeave(true);
  };

  const cancelSettings = async () => {
    setWorkTimeSetting(getInitialSecs("workTimeSec", "workTime", 25));
    setBreakTimeSetting(getInitialSecs("breakTimeSec", "breakTime", 5));
    setHoverDelaySetting(parseInt(localStorage.getItem("hoverDelay") || "5"));
    setMinOpacitySetting(parseFloat(localStorage.getItem("minOpacity") || "0.6"));
    setMinScaleSetting(parseFloat(localStorage.getItem("minScale") || "0.6"));
    setThemeColor(localStorage.getItem("themeColor") || "#3b82f6");
    setAlarmType(localStorage.getItem("alarmType") || "chime");
    
    await changeWindowSize(300, 150);
    
    await changeWindowSize(300, 150);
    
    setIsMenuOpen(false);
    setEditingPresetId(null);
    handleMouseLeave(true);
  };

  const openMenu = async () => {
    setIsHovered(true);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    await changeWindowSize(750, 600, "in-place");
    setIsMenuOpen(true);
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
    <div 
      className={`app-container ${isHovered || isMenuOpen ? "hovered" : "minimized"} ${isMenuOpen ? "menu-open" : ""} ${mode} ${isTeleporting ? "teleporting" : ""}`}
      onMouseEnter={handleMouseEnter}
        onMouseLeave={() => handleMouseLeave()}
        style={{
          '--minimized-opacity': minOpacitySetting,
          '--minimized-scale': minScaleSetting,
          '--primary': themeColor,
          '--anchor-origin': anchorPosition
        } as React.CSSProperties}
      >
        <audio ref={audioRef} preload="auto" />

      <div className="drag-region" data-tauri-drag-region>
        <div className="drag-handle" data-tauri-drag-region></div>
      </div>
      
      {!isMenuOpen && (
        <button className="view-toggle-btn" onClick={() => setMainView(v => v === 'timer' ? 'analytics' : 'timer')} title="Görünümü Değiştir">
          {mainView === 'timer' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          )}
        </button>
      )}

      <button className="close-btn" onClick={() => appWindow.hide()} title="Gizle (Tepsiye)">✕</button>

      <div className="content">
        {!isMenuOpen ? (
          <>
            {mainView === 'timer' ? (
              <>
                <div className="timer-display">
                  <h1 className={`glow-text ${hasHours ? 'long-text' : ''}`}>
                    {timeStr}
                  </h1>
                  <p className={`mode-label ${isRunning ? 'hidden' : ''}`}>{mode === "work" ? "Odaklan" : "Mola"}</p>
                </div>

                <div className="controls">
                  <button className="primary-btn" onClick={toggleTimer}>
                    {isRunning ? "Duraklat" : "Başlat"}
                  </button>
                  <button className="secondary-btn" onClick={resetTimer}>Sıfırla</button>
                </div>
              </>
            ) : (
              <>
                <div className="timer-display">
                  <h1 className={`glow-text ${currentAppSeconds >= 3600 ? 'long-text' : ''}`} style={{ color: '#10b981', textShadow: '0 0 30px rgba(16, 185, 129, 0.5)' }}>
                    {formatTime(currentAppSeconds)}
                  </h1>
                  <p className="mode-label" style={{ fontSize: '0.8rem', opacity: 0.9 }}>{currentApp || "Bilinmiyor"}</p>
                </div>

                <div className="controls">
                   <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Bugün Aktif</div>
                </div>
              </>
            )}

            <button className="menu-btn" onClick={openMenu} title="Menü">☰</button>
          </>
        ) : (
          <div className="unified-menu">
            <div className="menu-sidebar" data-tauri-drag-region>
              <div className="menu-drag-area" data-tauri-drag-region></div>
              <div className="menu-tabs">
                <button 
                  className={`menu-tab ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  Ayarlar
                </button>
                <button 
                  className={`menu-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => setActiveTab('analytics')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect width="4" height="7" x="7" y="14" rx="1"/><rect width="4" height="12" x="15" y="9" rx="1"/></svg>
                  İstatistikler
                </button>
              </div>
            </div>
            
            <div className="menu-content-area">
              <div className="menu-content-drag-handle" data-tauri-drag-region></div>
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
                      
                      <div className="live-preview-box">
                         <p className="preview-title">Küçülme & Saydamlık Önizlemesi</p>
                         <div className="preview-canvas">
                            <div className="preview-dummy" style={{
                               transform: `scale(${minScaleSetting})`,
                               opacity: minOpacitySetting,
                               boxShadow: `0 0 10px ${themeColor}40`,
                               transformOrigin: anchorPosition
                            }}>
                               <div className="preview-dummy-text" style={{ color: themeColor, textShadow: `0 0 10px ${themeColor}`}}>
                                  25:00
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="setting-row">
                        <label>Tema Rengi:</label>
                        <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
                      </div>
                      <div className="setting-row">
                        <label>Gizlenme Gecikmesi (sn):</label>
                        <input type="number" min="1" max="60" value={hoverDelaySetting} onChange={(e) => setHoverDelaySetting(Number(e.target.value))} />
                      </div>
                      
                      <div className="setting-grid-2">
                        <div className="setting-row vertical">
                          <label>Saydamlık:</label>
                          <input type="range" min="0.1" max="1" step="0.1" value={minOpacitySetting} onChange={(e) => setMinOpacitySetting(Number(e.target.value))} />
                        </div>
                        <div className="setting-row vertical">
                          <label>Küçülme Oranı:</label>
                          <input type="range" min="0.3" max="1" step="0.1" value={minScaleSetting} onChange={(e) => setMinScaleSetting(Number(e.target.value))} />
                        </div>
                      </div>

                      <div className="setting-row">
                        <label>Küçülme Yönü:</label>
                        <div className="alarm-select-wrapper">
                          <select value={anchorPosition} onChange={(e) => setAnchorPosition(e.target.value)}>
                            <option value="center center">Merkez</option>
                            <option value="top left">Sol Üst</option>
                            <option value="top center">Üst Orta</option>
                            <option value="top right">Sağ Üst</option>
                            <option value="bottom left">Sol Alt</option>
                            <option value="bottom center">Alt Orta</option>
                            <option value="bottom right">Sağ Alt</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="setting-group">
                      <div className="setting-group-title">Alarm (Sesi Test Et)</div>
                      <div className="setting-row">
                        <label>Zil Sesi:</label>
                        <select 
                          value={alarmType} 
                          onChange={(e) => {
                            setAlarmType(e.target.value);
                            playAlarm(e.target.value);
                          }}
                        >
                          <option value="chime">Çan (Chime)</option>
                          <option value="beep">Bip (Beep)</option>
                          <option value="bell">Zil (Soft Bell)</option>
                          <option value="custom">Özel Yükle</option>
                        </select>
                      </div>
                      {alarmType === "custom" && (
                        <div className="setting-row upload-row">
                          <label className="audio-upload-label">
                            🎵 MP3 Yükle
                            <input type="file" accept="audio/*" onChange={handleAudioUpload} hidden />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="settings-controls">
                    <button type="button" className="cancel-btn" onClick={cancelSettings}>İptal / Kapat</button>
                    <button type="submit" className="save-btn">Kaydet</button>
                  </div>
                </form>
              )}
              {activeTab === 'analytics' && (
                <div className="analytics-tab-wrapper">
                  <Analytics />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
