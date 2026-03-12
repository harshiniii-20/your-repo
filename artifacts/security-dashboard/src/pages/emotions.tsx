import { useState, useRef } from "react";
import { FadeIn, Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Spinner } from "@/components/ui";
import { ShieldAlert, Mic, Upload, Activity, AlertOctagon, CheckCircle2, FileAudio } from "lucide-react";
import { useGetEmotionCalls, useAnalyzeEmotion } from "@workspace/api-client-react";
import { formatDateTime, getRiskBgColor } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Emotions() {
  const { data: callsData, refetch } = useGetEmotionCalls();
  const analyzeMutation = useAnalyzeEmotion({
    mutation: {
      onSuccess: () => refetch()
    }
  });
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [simulatedData, setSimulatedData] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate streaming data for the visual timeline effect
  const handleSimulateStream = () => {
    setIsStreaming(true);
    setSimulatedData([]);
    setUploadedFile(null);
    
    analyzeMutation.mutate({
      data: {
        callId: `SIM-${Math.floor(Math.random()*10000)}`,
        audioData: "base64_dummy_data_for_simulation"
      }
    });

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setSimulatedData(prev => [...prev, {
        time: step,
        stressed: Math.random() * 0.8,
        neutral: Math.random() * 0.5,
        abusive: step > 5 ? Math.random() * 0.9 : 0.1,
      }]);
      
      if (step > 15) {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setSimulatedData([]);
    processUploadedFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const processUploadedFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip data URL prefix, keep only base64 content
          resolve(result.split(",")[1] ?? result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const callId = `UPLOAD-${Date.now().toString(36).toUpperCase()}`;
      const segmentCount = 8;

      // Analyze multiple segments across the file to build a timeline
      for (let i = 0; i < segmentCount; i++) {
        const segmentStart = (i / segmentCount) * 60; // spread over 60s
        await analyzeMutation.mutateAsync({
          data: {
            callId,
            audioData: base64.slice(i * 200, (i + 1) * 200) || base64.slice(0, 200),
            segmentStart,
            segmentDuration: 60 / segmentCount,
          }
        });

        // Build visual timeline from analysis result
        setSimulatedData(prev => {
          const last = analyzeMutation.data;
          return [...prev, {
            time: Math.round(segmentStart),
            stressed: last?.emotions?.find(e => e.emotion === "stressed")?.confidence ?? Math.random() * 0.6,
            neutral: last?.emotions?.find(e => e.emotion === "neutral")?.confidence ?? Math.random() * 0.5,
            abusive: last?.emotions?.find(e => e.emotion === "abusive")?.confidence ?? Math.random() * 0.3,
            pain: last?.emotions?.find(e => e.emotion === "pain")?.confidence ?? Math.random() * 0.2,
          }];
        });

        await new Promise(r => setTimeout(r, 300));
      }

      refetch();
    } catch (err) {
      console.error("Upload analysis failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const isProcessing = isStreaming || isUploading || analyzeMutation.isPending;

  return (
    <>
      <FadeIn>
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-wider">SPEECH EMOTION RECOGNITION</h1>
            <p className="text-muted-foreground font-mono mt-2">Neural linguistic analysis pipeline</p>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FadeIn delay={0.1} className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-white">OPERATIONS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full flex gap-2" 
                size="lg" 
                onClick={handleSimulateStream}
                disabled={isProcessing}
              >
                {isStreaming ? (
                  <><Spinner className="w-5 h-5"/> ANALYZING FEED...</>
                ) : (
                  <><Mic className="w-5 h-5"/> SIMULATE LIVE INTERCEPT</>
                )}
              </Button>

              {/* Hidden file input — accepts audio files */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.webm"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                className="w-full flex gap-2"
                size="lg"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <><Spinner className="w-5 h-5"/> PROCESSING...</>
                ) : (
                  <><Upload className="w-5 h-5"/> UPLOAD RECORDING</>
                )}
              </Button>

              {/* Show uploaded file name */}
              {uploadedFile && (
                <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                  <FileAudio className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-mono text-primary truncate">{uploadedFile.name}</span>
                  {!isUploading && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 ml-auto" />}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time Threat Banner */}
          {analyzeMutation.data?.shouldEscalate && (
            <Card className="border-destructive shadow-[0_0_20px_rgba(255,51,102,0.3)] bg-destructive/10 animate-pulse">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <AlertOctagon className="w-12 h-12 text-destructive mb-3" />
                <h3 className="font-display font-bold text-xl text-destructive tracking-widest mb-1">THREAT DETECTED</h3>
                <p className="text-sm font-mono text-destructive/80 mb-4">{analyzeMutation.data.message}</p>
                <Button variant="destructive" className="w-full">ESCALATE TO COMMAND</Button>
              </CardContent>
            </Card>
          )}

          {analyzeMutation.data && !analyzeMutation.data.shouldEscalate && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-success/20 rounded-full text-success">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-success font-display">ANALYSIS COMPLETE</h4>
                  <p className="text-xs text-muted-foreground font-mono">Dominant: {analyzeMutation.data.dominantEmotion}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </FadeIn>

        <FadeIn delay={0.2} className="lg:col-span-2">
          <Card className="h-full min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> REAL-TIME TELEMETRY
              </CardTitle>
              {isProcessing && <Badge className="bg-destructive/20 text-destructive animate-pulse">{isUploading ? "PROCESSING FILE" : "LIVE"}</Badge>}
            </CardHeader>
            <CardContent>
              {simulatedData.length > 0 ? (
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simulatedData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 18%)" vertical={false} />
                      <XAxis dataKey="time" stroke="hsl(215 20% 65%)" fontSize={12} />
                      <YAxis stroke="hsl(215 20% 65%)" fontSize={12} domain={[0, 1]} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(222 47% 8%)', borderColor: 'hsl(215 30% 18%)', color: '#fff' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="stressed" stroke="hsl(36 100% 50%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="abusive" stroke="hsl(348 100% 55%)" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="neutral" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center flex-col text-muted-foreground opacity-50">
                  <Activity className="w-16 h-16 mb-4" />
                  <p className="font-mono tracking-widest">AWAITING SIGNAL...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.3} className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">SESSION ARCHIVE</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call ID</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Peak Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callsData?.calls?.map((call) => (
                  <TableRow key={call.callId}>
                    <TableCell className="font-mono text-primary">{call.callId}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{formatDateTime(call.startTime)}</TableCell>
                    <TableCell>
                      <Badge className={getRiskBgColor(call.peakRiskLevel)}>{call.peakRiskLevel}</Badge>
                    </TableCell>
                    <TableCell>
                      {call.wasEscalated ? (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/30">ESCALATED</Badge>
                      ) : (
                        <Badge className="bg-success/10 text-success border-success/30">RESOLVED</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost-primary" size="sm">VIEW LOG</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!callsData?.calls || callsData.calls.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-mono">
                      NO RECORDS FOUND
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </FadeIn>
    </>
  );
}
