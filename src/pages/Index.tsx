import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LanguageSelector } from "@/components/LanguageSelector";
import { StatusDisplay } from "@/components/StatusDisplay";
import { SubtitlesList } from "@/components/SubtitlesList";
import { JobStatus } from "@/types/subtitle";

const API_BASE = 'http://localhost:8000';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.success(`Selected: ${file.name} (${sizeMB} MB)`);
    }
  };

  const handleLanguageToggle = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const startStatusPolling = (jobId: string) => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
    }

    statusIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/status/${jobId}`);
        const data: JobStatus = await response.json();
        
        setJobStatus(data);
        
        if (data.status === 'completed') {
          clearInterval(statusIntervalRef.current!);
          toast.success('Subtitles generated successfully!');
        } else if (data.status === 'failed') {
          clearInterval(statusIntervalRef.current!);
          toast.error('Processing failed: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }

    if (selectedLanguages.length === 0) {
      toast.error('Please select at least one language');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('languages', selectedLanguages.join(','));

    setIsUploading(true);

    try {
      const response = await fetch(`${API_BASE}/upload/`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }

      setCurrentJobId(data.job_id);
      toast.success('Video uploaded! Processing started...');
      startStatusPolling(data.job_id);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      await fetch(`${API_BASE}/cleanup/`, { method: 'DELETE' });
      
      setSelectedFile(null);
      setSelectedLanguages([]);
      setCurrentJobId(null);
      setJobStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
      
      toast.success('All files cleaned up successfully!');
    } catch (error) {
      toast.error('Cleanup failed');
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[image:var(--gradient-primary)] flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="p-8 shadow-[var(--shadow-elegant)] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
              🎬 Subtitle Generator
            </h1>
            <p className="text-muted-foreground">
              Upload your video and generate subtitles in multiple languages
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="video-file" className="text-base font-semibold">
                Select Video File
              </Label>
              <div className="relative">
                <Input
                  id="video-file"
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="cursor-pointer file:cursor-pointer file:mr-4 file:px-4 file:py-2 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            <LanguageSelector
              selectedLanguages={selectedLanguages}
              onLanguageToggle={handleLanguageToggle}
            />

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                className="flex-1 gap-2 h-12 text-base font-semibold"
                size="lg"
              >
                <Upload className="h-5 w-5" />
                {isUploading ? 'Uploading...' : 'Generate Subtitles'}
              </Button>
              
              {currentJobId && (
                <Button
                  onClick={handleCleanup}
                  variant="destructive"
                  size="lg"
                  className="gap-2 h-12"
                >
                  <Trash2 className="h-5 w-5" />
                  Clear Files
                </Button>
              )}
            </div>
          </div>
        </Card>

        {currentJobId && jobStatus && (
          <StatusDisplay jobId={currentJobId} status={jobStatus} />
        )}

        {jobStatus && jobStatus.subtitles.length > 0 && (
          <SubtitlesList subtitles={jobStatus.subtitles} apiBase={API_BASE} />
        )}
      </div>
    </div>
  );
};

export default Index;
