export const bucket = 'munimap-transcriptions';

export type Transcription = {
  absent: string[];
  audioURL: string;
  chapters: TranscriptionChapter[];
  date: string;
  department: string;
  organization: string;
  present: string[];
  speakers: Record<string, string>;
  subject: string;
  utterances: TranscriptionUtterance[];
  visitors: string[];
};

export type TranscriptionChapter = {
  end: number;
  hash?: string;
  start: number;
  summary?: string;
  title: string;
};

export type TranscriptionUtterance = {
  end: number;
  index: number;
  speaker: string;
  start: number;
  text: string;
};
