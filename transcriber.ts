import { AssemblyAI } from "assemblyai";
import { PutObjectCommand } from "s3Client";
import { S3Client } from "s3Client";
import { Transcription } from "./types.ts";
import { TranscriptionUtterance } from "./types.ts";

import { bucket } from "./types.ts";
import { parse as parsePath } from "@std/path/parse";
import { parseArgs } from "@std/cli/parse-args";

// 🔥 the JSON input and HTML output files are relative to
//    this S3 { bucket }

// 👇 AssemblyAI works best with an accurate count of speakers

const flags = parseArgs(Deno.args, {
	string: ["num-speakers"],
	default: { "num-speakers": 4 },
	negatable: ["color"],
});

// 👉 default used for testing; keep it as a template for data entry
const sourceDflt = `September+3+PB+Meeting+Clip.mp3`;

// 👇 solicit the MP3 audio file

const sourceFile = prompt(
	"⌨️ Enter audio file to transcribe:",
	sourceDflt,
) as string ?? sourceDflt;
const sourceURL = `https://${bucket}.s3.us-east-1.amazonaws.com/${sourceFile}`;

// 👉 JSON outout file
const targetFile = `${parsePath(sourceFile).name}.json`;

// 👉 AssemblyAI client for speech to text
const aiClient = new AssemblyAI({
	apiKey: Deno.env.get("ASSEMBLY_AI_KEY") ?? "unknown",
});

// 👉 S3 client to read and write into bucket
const s3Client = new S3Client({});

// 👇 these dots signify a long-running operation in the CLI

const encoder = new TextEncoder();
Deno.stdout.write(encoder.encode("👉 Transcribing audio file."));
const timerID = setInterval(() => {
	Deno.stdout.write(encoder.encode("."));
}, 100);

// 👇 transcribe the audio file

const transcript = await aiClient.transcripts.transcribe({
	audio: sourceURL,
	speaker_labels: true,
	speakers_expected: Number(flags["num-speakers"]),
});
clearInterval(timerID);
Deno.stdout.write(encoder.encode("\n"));

// 🔥 oh oh, maybe it didn't work!

if (transcript.status === "error") {
	console.error(`🔥 Transcription failed: ${transcript.error}`);
	Deno.exit(1);
} else console.log("👉 Transcription completed");

// 👇 extract just the utterances, dropping extraneous data

const utterances: TranscriptionUtterance[] = (transcript?.utterances ?? []).map(
	(
		u: any,
		index: number,
	) => {
		delete u.confidence;
		delete u.words;
		u.index = index;
		return u;
	},
);

// 👇 placeholders for Speaker A, Speaker B etc

const dummySpeakers = [
	"Alpha",
	"Bravo",
	"Charlie",
	"Delta",
	"Echo",
	"Foxtrot",
	"Golf",
	"Hotel",
	"India",
	"Juliet",
	"Kilo",
	"Lima",
	"Mike",
	"November",
	"Oscar",
	"Papa",
	"Quebec",
	"Romeo",
	"Sierra",
	"Tango",
	"Uniform",
	"Victor",
	"Whiskey",
	"Xray",
	"Tankee",
	"Zulu",
].reduce((acc: Record<string, string>, speaker) => {
	acc[speaker.substring(0, 1)] = speaker;
	return acc;
}, {});

// 👇 these are just the speakers detected

const speakers = utterances.reduce(
	(acc: Record<string, string>, utterance: any) => {
		acc[utterance.speaker] = dummySpeakers[utterance.speaker];
		return acc;
	},
	{},
);

// 👇 construct the transcription JSON
//    all the placeholders help testing and are a good template
//    for the manual entries that m ust be made before formatting
//    see formatter.ts

const transcription: Transcription = {
	absent: ["Fred Douglas"],
	audioURL: sourceURL,
	chapters: [{
		end: utterances.at(-1).index,
		start: utterances.at(0).index,
		title: "Public Hearing",
	}],
	date: "2024-11-05 18:30:00-05:00",
	department: "Planning Board",
	organization: "Town of Washington",
	present: ["Mark Florence", "Peter Martin", "Don Revane"],
	speakers,
	subject: "Public Hearing",
	utterances,
	visitors: ["Nick Cashorali"],
};

// 👇 we're done!
//    save the JSON into its S3 bucket

console.log(`👉 Saving ${targetFile}`);
await s3Client.send(
	new PutObjectCommand({
		Bucket: bucket,
		Key: targetFile,
		Body: JSON.stringify(transcription, null, 2),
		ContentType: "application/json",
	}),
);
