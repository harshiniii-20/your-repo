import { useState } from "react";
import { FadeIn, Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Spinner } from "@/components/ui";
import { Fingerprint, AlertTriangle, ShieldCheck, Target, Crosshair } from "lucide-react";
import { useGetAnomalies, useAnalyzeAnomaly } from "@workspace/api-client-react";
import { formatDateTime, getRiskBgColor } from "@/lib/utils";

export default function Anomalies() {
  const { data: anomaliesData, refetch } = useGetAnomalies();
  const analyzeMutation = useAnalyzeAnomaly({
    mutation: {
      onSuccess: () => refetch()
    }
  });

  const [formData, setFormData] = useState({
    username: "",
    ipAddress: "",
    country: "",
    deviceType: ""
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    analyzeMutation.mutate({ data: formData });
  };

  return (
    <>
      <FadeIn>
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-wider flex items-center gap-3">
              <Fingerprint className="w-8 h-8 text-destructive" />
              THREAT INTELLIGENCE
            </h1>
            <p className="text-muted-foreground font-mono mt-2">AI-driven behavioral anomaly detection</p>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FadeIn delay={0.1} className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="bg-black/40 border-b border-white/5">
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> NEW TARGET ANALYSIS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground">TARGET ID</label>
                  <Input 
                    placeholder="username" 
                    value={formData.username}
                    onChange={e => setFormData(p => ({...p, username: e.target.value}))}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground">IP VECTOR</label>
                  <Input 
                    placeholder="0.0.0.0" 
                    value={formData.ipAddress}
                    onChange={e => setFormData(p => ({...p, ipAddress: e.target.value}))}
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-muted-foreground">GEO</label>
                    <Input 
                      placeholder="Country" 
                      value={formData.country}
                      onChange={e => setFormData(p => ({...p, country: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-muted-foreground">DEVICE</label>
                    <Input 
                      placeholder="mobile/desktop" 
                      value={formData.deviceType}
                      onChange={e => setFormData(p => ({...p, deviceType: e.target.value}))}
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full mt-4"
                  disabled={analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending ? <Spinner /> : <><Crosshair className="w-4 h-4 mr-2" /> EXECUTE SCAN</>}
                </Button>
              </form>

              {analyzeMutation.data && (
                <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4">
                  <h4 className="font-display text-sm text-muted-foreground mb-3">SCAN RESULTS</h4>
                  <div className={`p-4 rounded-lg border ${analyzeMutation.data.isAnomaly ? 'bg-destructive/10 border-destructive/30' : 'bg-success/10 border-success/30'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-bold ${analyzeMutation.data.isAnomaly ? 'text-destructive' : 'text-success'}`}>
                        {analyzeMutation.data.isAnomaly ? 'ANOMALY DETECTED' : 'CLEAR'}
                      </span>
                      <span className="font-mono text-2xl font-bold text-white">{analyzeMutation.data.riskScore}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{analyzeMutation.data.message}</p>
                    
                    {analyzeMutation.data.factors?.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <p className="text-xs font-mono text-white/50">VECTORS:</p>
                        {analyzeMutation.data.factors.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <AlertTriangle className="w-3 h-3 text-warning" />
                            <span className="text-white/80">{f.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2} className="lg:col-span-2">
          <div className="space-y-4">
            {anomaliesData?.anomalies?.map((anomaly, idx) => (
              <FadeIn key={anomaly.id} delay={0.1 * idx}>
                <Card className={`border-l-4 ${
                  anomaly.severity === 'critical' ? 'border-l-destructive bg-destructive/5' : 
                  anomaly.severity === 'high' ? 'border-l-destructive' : 
                  'border-l-warning'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={getRiskBgColor(anomaly.severity)}>{anomaly.severity}</Badge>
                          <span className="font-mono text-primary font-bold">{anomaly.username}</span>
                          <span className="text-xs text-muted-foreground font-mono">{formatDateTime(anomaly.detectedAt)}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{anomaly.description}</h3>
                        <p className="text-sm text-muted-foreground font-mono uppercase">Vector: {anomaly.anomalyType.replace('_', ' ')}</p>
                      </div>
                      
                      <div className="flex flex-col items-end justify-between min-w-[120px]">
                        <div className="text-center bg-black/40 px-4 py-2 rounded-lg border border-white/5 w-full">
                          <div className="text-xs text-muted-foreground font-mono mb-1">RISK SCORE</div>
                          <div className={`text-2xl font-bold font-display ${anomaly.riskScore > 80 ? 'text-destructive glow-text-destructive' : 'text-warning'}`}>
                            {anomaly.riskScore}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm" className="border-success/50 text-success hover:bg-success/20">
                            <ShieldCheck className="w-4 h-4 mr-1" /> ALLOW
                          </Button>
                          <Button variant="destructive" size="sm">BLOCK</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
            {(!anomaliesData?.anomalies || anomaliesData.anomalies.length === 0) && (
              <div className="p-12 text-center border border-dashed border-white/20 rounded-xl bg-white/5">
                <ShieldCheck className="w-12 h-12 text-success mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-display text-white mb-2">NETWORK SECURE</h3>
                <p className="text-muted-foreground font-mono">No active anomalies detected in current timeframe.</p>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </>
  );
}
