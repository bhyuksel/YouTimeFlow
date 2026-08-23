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
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [chartLimit, setChartLimit] = useState(5);

  useEffect(() => {
    fetchData();
    // Auto refresh every 5 seconds while modal is open
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchData = async () => {
    try {
      const usageData: UsageData = await invoke("get_usage_data");
      const today = new Date();
      
      let prefix = "";
      if (timeRange === 'daily') {
        prefix = today.toISOString().split("T")[0]; // YYYY-MM-DD
      } else if (timeRange === 'monthly') {
        prefix = today.toISOString().substring(0, 7); // YYYY-MM
      } else if (timeRange === 'yearly') {
        prefix = today.toISOString().substring(0, 4); // YYYY
      }
      
      const aggregatedUsage: Record<string, number> = {};
      
      if (usageData && usageData.daily_usage) {
        for (const [date, apps] of Object.entries(usageData.daily_usage)) {
          if (date.startsWith(prefix)) {
            for (const [app, seconds] of Object.entries(apps)) {
              aggregatedUsage[app] = (aggregatedUsage[app] || 0) + seconds;
            }
          }
        }
      }
      
      let total = 0;
      const formattedData = Object.entries(aggregatedUsage).map(([app, seconds]) => {
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

  const getSummaryTitle = () => {
    if (timeRange === 'daily') return "Bugün Toplam:";
    if (timeRange === 'monthly') return "Bu Ay Toplam:";
    return "Bu Yıl Toplam:";
  };

  return (
    <div className="analytics-content">
      <div className="analytics-header-controls">
        <div className="time-range-selector">
          <button className={timeRange === 'daily' ? 'active' : ''} onClick={() => setTimeRange('daily')}>Bugün</button>
          <button className={timeRange === 'monthly' ? 'active' : ''} onClick={() => setTimeRange('monthly')}>Bu Ay</button>
          <button className={timeRange === 'yearly' ? 'active' : ''} onClick={() => setTimeRange('yearly')}>Bu Yıl</button>
        </div>
      </div>

      <div className="analytics-summary">
          <div className="summary-header-row">
            <p>{getSummaryTitle()}</p>
            <div className="chart-limit-control">
              <label>Sayı:</label>
              <select value={chartLimit} onChange={(e) => setChartLimit(Number(e.target.value))}>
                {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <h3>{formatTime(totalSeconds)}</h3>
        </div>

        {data.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.slice(0, chartLimit)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={90} tick={{ fill: 'var(--text-color)', fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: any) => formatTime(Number(value))}
                  contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Bar dataKey="seconds" radius={[0, 4, 4, 0]} barSize={16}>
                  {data.slice(0, chartLimit).map((_, index) => (
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
