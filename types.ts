import { TranscriptUtterance } from "assemblyai";

export const bucket = "munimap-transcriptions";

export type Transcription = {
  absent: string[];
  audioURL: string;
  date: string;
  department: string;
  organization: string;
  present: string[];
  speakers: Record<string, string>;
  subject: string;
  utterances: Omit<TranscriptUtterance, "words">[];
  visitors: string[];
};
