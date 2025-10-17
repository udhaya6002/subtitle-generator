import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { JobStatus } from "@/types/subtitle";

interface StatusDisplayProps {
  jobId: string;
  status: JobStatus;
}

const STATUS_CONFIG = {
  queued: { label: 'Queued', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  extracting_audio: { label: 'Extracting Audio', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  transcribing: { label: 'Transcribing', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  writing_subtitles: { label: 'Writing Subtitles', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 border-red-200' }
};

export const StatusDisplay = ({ jobId, status }: StatusDisplayProps) => {
  const config = STATUS_CONFIG[status.status];
  const isProcessing = !['completed', 'failed'].includes(status.status);

  return (
    <Card className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-lg font-semibold">Processing Status</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Job ID:</span>
          <span className="text-sm font-mono">{jobId.slice(0, 8)}...</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant="outline" className={`${config.color} border`}>
            {isProcessing && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            {config.label}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Languages:</span>
          <span className="text-sm">{status.languages.join(', ')}</span>
        </div>
        
        {status.error && (
          <div className="pt-2 border-t">
            <span className="text-sm text-destructive font-medium">Error:</span>
            <p className="text-sm text-destructive mt-1">{status.error}</p>
          </div>
        )}
      </div>
    </Card>
  );
};
