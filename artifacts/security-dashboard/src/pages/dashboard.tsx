import { FadeIn, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { ShieldAlert, Activity, Fingerprint, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { useGetLoginStats, useGetAnomalies } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getRiskBgColor, formatDateTime } from "@/lib/utils";

export default function Dashboard() {
  const { data: loginStats, isLoading: loadingStats } = useGetLoginStats();
  const { data: anomaliesData } = useGetAnomalies();

  const StatCard = ({ title, value, icon: Icon, colorClass, delay }: any) => (
    <FadeIn delay={delay}>
      <Card className="relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:opacity-20 ${colorClass}`}>
          <Icon className="w-24 h-24" />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-lg bg-black/40 border border-white/10 ${colorClass}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
          </div>
          <div className="text-4xl font-bold font-display tracking-tight text-white">
            {value}
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );

  return (
    <>
      <FadeIn>
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-wider">SYSTEM OVERVIEW</h1>
            <p className="text-muted-foreground font-mono mt-2">Global intelligence network status: <span className="text-success glow-text-primary">ONLINE</span></p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg border border-primary/30">
             <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
             <span className="font-mono text-sm text-primary tracking-widest">LIVE UPLINK</span>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Attempts" 
          value={loadingStats ? "-" : loginStats?.totalAttempts?.toLocaleString()} 
          icon={Activity} 
          colorClass="text-primary"
          delay={0.1}
        />
        <StatCard 
          title="Failed Logins" 
          value={loadingStats ? "-" : loginStats?.failureCount?.toLocaleString()} 
          icon={AlertTriangle} 
          colorClass="text-warning"
          delay={0.2}
        />
        <StatCard 
          title="Anomalies Detected" 
          value={loadingStats ? "-" : anomaliesData?.total || 0} 
          icon={Fingerprint} 
          colorClass="text-destructive"
          delay={0.3}
        />
        <StatCard 
          title="Active Calls" 
          value="12" // Simulated real-time stat
          icon={ShieldAlert} 
          colorClass="text-secondary"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <FadeIn delay={0.5} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> LOGIN TRAFFIC (24H)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {loginStats?.hourlyBreakdown && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={loginStats.hourlyBreakdown}>
                      <defs>
                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(348 100% 55%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(348 100% 55%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 18%)" vertical={false} />
                      <XAxis dataKey="hour" stroke="hsl(215 20% 65%)" fontSize={12} tickFormatter={(val) => `${val}:00`} />
                      <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(222 47% 8%)', borderColor: 'hsl(215 30% 18%)', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="success" stroke="hsl(142 71% 45%)" fillOpacity={1} fill="url(#colorSuccess)" name="Success" />
                      <Area type="monotone" dataKey="failure" stroke="hsl(348 100% 55%)" fillOpacity={1} fill="url(#colorFail)" name="Failure" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.6}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2 glow-text-destructive">
                <Fingerprint className="w-5 h-5" /> RECENT ANOMALIES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomaliesData?.anomalies?.slice(0, 5).map((anomaly) => (
                  <div key={anomaly.id} className="p-4 rounded-lg bg-black/30 border border-white/5 hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm font-bold text-white">{anomaly.username}</span>
                      <Badge className={getRiskBgColor(anomaly.severity)}>{anomaly.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{anomaly.description}</p>
                    <div className="text-[10px] font-mono text-primary opacity-70">
                      {formatDateTime(anomaly.detectedAt)}
                    </div>
                  </div>
                ))}
                {(!anomaliesData?.anomalies || anomaliesData.anomalies.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground font-mono">
                    NO ANOMALIES DETECTED
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </>
  );
}
