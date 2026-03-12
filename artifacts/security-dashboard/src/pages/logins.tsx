import { useState } from "react";
import { FadeIn, Card, CardContent, CardHeader, CardTitle, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button } from "@/components/ui";
import { Globe, ShieldCheck, ShieldAlert, Monitor, Smartphone, Tablet } from "lucide-react";
import { useGetLoginAttempts, useGetLoginStats } from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/utils";

export default function Logins() {
  const [filter, setFilter] = useState<'all' | 'success' | 'failure'>('all');
  const { data: attemptsData, isLoading } = useGetLoginAttempts({ status: filter });
  const { data: statsData } = useGetLoginStats();

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <>
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-white/10 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-wider">ACCESS LOGS</h1>
            <p className="text-muted-foreground font-mono mt-2">Authentication attempt visualization</p>
          </div>
          <div className="flex gap-2 p-1 bg-black/40 border border-white/10 rounded-lg">
            {(['all', 'success', 'failure'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md font-display font-bold uppercase tracking-widest text-xs transition-all ${
                  filter === f 
                    ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(0,240,255,0.5)]' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <FadeIn delay={0.1}>
          <Card className="bg-gradient-to-br from-black/60 to-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-display text-primary uppercase tracking-widest mb-1">Top Vector</p>
                <h3 className="text-2xl font-bold text-white">
                  {statsData?.topCountries?.[0]?.country || "Unknown"}
                </h3>
              </div>
              <Globe className="w-10 h-10 text-primary opacity-50" />
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.2}>
          <Card className="bg-gradient-to-br from-black/60 to-success/5 border-success/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-display text-success uppercase tracking-widest mb-1">Success Rate</p>
                <h3 className="text-2xl font-bold text-white">
                  {statsData ? Math.round((statsData.successCount / statsData.totalAttempts) * 100) : 0}%
                </h3>
              </div>
              <ShieldCheck className="w-10 h-10 text-success opacity-50" />
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.3}>
          <Card className="bg-gradient-to-br from-black/60 to-destructive/5 border-destructive/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-display text-destructive uppercase tracking-widest mb-1">Threat Score</p>
                <h3 className="text-2xl font-bold text-white">
                  {statsData?.anomalyCount || 0} Flags
                </h3>
              </div>
              <ShieldAlert className="w-10 h-10 text-destructive opacity-50" />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.4}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
            <CardTitle className="text-white">AUTHENTICATION LEDGER</CardTitle>
            <Badge variant="outline" className="font-mono">{attemptsData?.total || 0} RECORDS</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Identity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Vector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attemptsData?.attempts?.map((attempt) => (
                    <TableRow key={attempt.id} className={attempt.isAnomaly ? "bg-warning/5" : ""}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatDateTime(attempt.timestamp)}
                      </TableCell>
                      <TableCell className="font-bold text-white">{attempt.username}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-white flex items-center gap-2">
                            <Globe className="w-3 h-3 text-primary" /> {attempt.city}, {attempt.country}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">{attempt.ipAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {getDeviceIcon(attempt.deviceType)}
                          <span className="capitalize text-sm">{attempt.deviceType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {attempt.status === 'success' ? (
                          <Badge className="bg-success/10 text-success border-success/30">SUCCESS</Badge>
                        ) : (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/30">FAILED</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono font-bold ${attempt.riskScore > 70 ? 'text-destructive glow-text-destructive' : attempt.riskScore > 30 ? 'text-warning' : 'text-success'}`}>
                          {attempt.riskScore}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!attemptsData?.attempts || attemptsData.attempts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-mono">
                        NO LOGS FOUND FOR CURRENT FILTER
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </>
  );
}
