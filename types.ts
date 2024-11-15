import { TranscriptUtterance } from "assemblyai";

export const bucket = "munimap-transcriptions";

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
  utterances: Omit<TranscriptUtterance, "words">[];
  visitors: string[];
};

export type TranscriptionChapter = {
  end: number;
  hash?: string;
  start: number;
  summary?: string;
  title: string;
};
