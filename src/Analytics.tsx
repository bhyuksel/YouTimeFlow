import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "./Analytics.css";

interface UsageData {
  daily_usage: Record<string, Record<string, number>>;
}

export function Analytics() {
  const [data, setData] = useState<any[]>([]);
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    fetchData();
    // Auto refresh every 5 seconds while modal is open
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const usageData: UsageData = await invoke("get_usage_data");
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const todayUsage = usageData.daily_usage[today] || {};
      
      let total = 0;
      const formattedData = Object.entries(todayUsage).map(([app, seconds]) => {
        total += seconds;
        return {
          name: app,
          seconds,
          displayTime: formatTime(seconds),
        };
      });
      
      // Sort by most used
      formattedData.sort((a, b) => b.seconds - a.seconds);
      
      setTotalSeconds(total);
      setData(formattedData);
    } catch (err) {
      console.error("Failed to fetch usage data:", err);
    }
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}s ${m}d`;
    return `${m}d ${sec % 60}sn`;
  };

  // Color palette for charts
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

  return (
    <div className="analytics-content">
      <div className="analytics-summary">
          <p>Bugün Toplam:</p>
          <h3>{formatTime(totalSeconds)}</h3>
        </div>

        {data.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={90} tick={{ fill: 'var(--text-color)', fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: any) => formatTime(Number(value))}
                  contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Bar dataKey="seconds" radius={[0, 4, 4, 0]} barSize={16}>
                  {data.slice(0, 5).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="no-data">
            <p>Veri toplanıyor...</p>
          </div>
        )}
        
        <div className="app-list">
          {data.map((app, idx) => (
            <div className="app-item" key={idx}>
              <div className="app-name">
                <span className="dot" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                {app.name}
              </div>
              <div className="app-time">{app.displayTime}</div>
            </div>
          ))}
        </div>
    </div>
  );
}
