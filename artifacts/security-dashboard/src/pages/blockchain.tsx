import { FadeIn, Card, CardContent, Button, Badge, Spinner } from "@/components/ui";
import { Link as LinkIcon, ShieldCheck, AlertTriangle, ArrowRight, Box } from "lucide-react";
import { useGetBlockchainLogs, useVerifyBlockchain } from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/utils";

export default function Blockchain() {
  const { data: chainData, isLoading, refetch } = useGetBlockchainLogs();
  const verifyMutation = useVerifyBlockchain({
    query: { enabled: false } // only run manually
  });

  const handleVerify = () => {
    verifyMutation.refetch();
  };

  return (
    <>
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-white/10 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-wider flex items-center gap-3">
              <LinkIcon className="w-8 h-8 text-primary" />
              IMMUTABLE LEDGER
            </h1>
            <p className="text-muted-foreground font-mono mt-2">Cryptographic audit trail</p>
          </div>
          <Button 
            onClick={handleVerify} 
            disabled={verifyMutation.isFetching}
            variant="outline"
            className="bg-black/40"
          >
            {verifyMutation.isFetching ? <Spinner className="mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
            VERIFY CHAIN INTEGRITY
          </Button>
        </div>
      </FadeIn>

      {verifyMutation.data && (
        <FadeIn className="mb-8">
          <div className={`p-4 rounded-xl border ${verifyMutation.data.isValid ? 'bg-success/10 border-success/30 text-success' : 'bg-destructive/10 border-destructive/30 text-destructive'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {verifyMutation.data.isValid ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              <div>
                <h3 className="font-bold font-display uppercase tracking-widest">
                  {verifyMutation.data.isValid ? 'CHAIN INTEGRITY VERIFIED' : 'TAMPERING DETECTED'}
                </h3>
                <p className="text-sm font-mono opacity-80">{verifyMutation.data.message}</p>
              </div>
            </div>
            {!verifyMutation.data.isValid && verifyMutation.data.invalidBlockIndex && (
              <Badge variant="destructive" className="font-mono text-sm px-4 py-1">
                BLOCK #{verifyMutation.data.invalidBlockIndex} CORRUPTED
              </Badge>
            )}
          </div>
        </FadeIn>
      )}

      {isLoading ? (
        <div className="flex justify-center p-20"><Spinner className="w-10 h-10 text-primary" /></div>
      ) : (
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-white/5 z-0 hidden md:block" />

          <div className="space-y-6 relative z-10">
            {chainData?.chain?.map((block, index) => (
              <FadeIn key={block.hash} delay={index * 0.1}>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  
                  {/* Block Index Marker */}
                  <div className="hidden md:flex flex-col items-center mt-6">
                    <div className="w-16 h-16 rounded-2xl bg-black border-2 border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)] z-10 relative">
                      <Box className="w-6 h-6 text-primary absolute opacity-20" />
                      <span className="font-display font-bold text-xl text-white">#{block.index}</span>
                    </div>
                  </div>

                  {/* Block Content */}
                  <Card className="flex-1 bg-black/40 border-white/10 hover:border-primary/50 transition-colors w-full">
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-white/5">
                        <div className="p-4 border-r border-white/5">
                          <p className="text-xs text-muted-foreground font-mono mb-1">TIMESTAMP</p>
                          <p className="text-sm text-white font-mono">{formatDateTime(block.timestamp)}</p>
                        </div>
                        <div className="p-4 border-r border-white/5">
                          <p className="text-xs text-muted-foreground font-mono mb-1">EVENT TYPE</p>
                          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                            {block.data.eventType}
                          </Badge>
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-muted-foreground font-mono mb-1">NONCE</p>
                          <p className="text-sm text-white font-mono">{block.nonce}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-black/60">
                        <div className="space-y-3 font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-16">HASH:</span>
                            <span className="text-primary truncate">{block.hash}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-16">PREV:</span>
                            <span className="text-muted-foreground truncate">{block.previousHash}</span>
                          </div>
                          <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                            <span className="text-muted-foreground w-16">DATA:</span>
                            <div className="text-white/80 whitespace-pre-wrap">
                              {JSON.stringify(block.data, null, 2).replace(/[{"}]/g, '').trim()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Arrow to next block */}
                {index < (chainData.chain.length - 1) && (
                  <div className="hidden md:flex justify-center w-32 py-2 text-white/20">
                    <ArrowRight className="w-6 h-6 rotate-90" />
                  </div>
                )}
              </FadeIn>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
