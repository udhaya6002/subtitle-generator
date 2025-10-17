import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { SubtitleFile } from "@/types/subtitle";
import { toast } from "sonner";

interface SubtitlesListProps {
  subtitles: SubtitleFile[];
  apiBase: string;
}

export const SubtitlesList = ({ subtitles, apiBase }: SubtitlesListProps) => {
  const handleDownload = async (url: string, filename: string) => {
    try {
      const downloadUrl = `${apiBase}${url}`;
      console.log('Attempting download from:', downloadUrl);
      
      const response = await fetch(downloadUrl);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'type:', blob.type);
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      window.URL.revokeObjectURL(link.href);
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (subtitles.length === 0) return null;

  return (
    <Card className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-lg font-semibold">Generated Subtitles</h3>
      
      <div className="space-y-2">
        {subtitles.map((subtitle) => (
          <div
            key={subtitle.filename}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          >
            <span className="text-sm font-medium">{subtitle.filename}</span>
            <Button
              size="sm"
              onClick={() => handleDownload(subtitle.download_url, subtitle.filename)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
