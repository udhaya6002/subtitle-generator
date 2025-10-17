export interface SubtitleFile {
  filename: string;
  download_url: string;
}

export interface JobStatus {
  status: 'queued' | 'extracting_audio' | 'transcribing' | 'writing_subtitles' | 'completed' | 'failed';
  created_at: string;
  languages: string[];
  subtitles: SubtitleFile[];
  error: string | null;
  completed_at?: string;
}

export interface Language {
  name: string;
  code: string;
}

export const LANGUAGES: Language[] = [
  { name: 'English', code: 'en' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'German', code: 'de' },
  { name: 'Italian', code: 'it' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Russian', code: 'ru' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Korean', code: 'ko' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Hindi', code: 'hi' }
];
