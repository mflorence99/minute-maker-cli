import { AssemblyAI } from "assemblyai";
import { PutObjectCommand } from "s3Client";
import { S3Client } from "s3Client";
import { Transcription } from "./types.ts";

import { bucket } from "./types.ts";
import { omit } from "@std/collections";
import { parse as parsePath } from "@std/path/parse";
import { parseArgs } from "@std/cli/parse-args";

const flags = parseArgs(Deno.args, {
	string: ["num-speakers"],
	default: { "num-speakers": 4 },
	negatable: ["color"],
});

const sourceDflt = `September+3+PB+Meeting+Clip.mp3`;

const sourceFile = prompt(
	"👉 Enter audio file to transcribe:",
	sourceDflt,
) as string ?? sourceDflt;

const sourceURL = `https://${bucket}.s3.us-east-1.amazonaws.com/${sourceFile}`;

const targetFile = `${parsePath(sourceFile).name}.json`;

const aiClient = new AssemblyAI({
	apiKey: Deno.env.get("ASSEMBLY_AI_KEY") ?? "unknown",
});

const s3Client = new S3Client({});

const encoder = new TextEncoder();
Deno.stdout.write(encoder.encode("👉 Transcribing audio file."));
const timerID = setInterval(() => {
	Deno.stdout.write(encoder.encode("."));
}, 100);

const transcript = await aiClient.transcripts.transcribe({
	audio: sourceURL,
	speaker_labels: true,
	speakers_expected: Number(flags["num-speakers"]),
});
clearInterval(timerID);
Deno.stdout.write(encoder.encode("\n"));

if (transcript.status === "error") {
	console.error(`🔥 Transcription failed: ${transcript.error}`);
	Deno.exit(1);
} else console.log("👉 Transcription completed");

const utterances = (transcript?.utterances ?? []).map((u) =>
	omit(u, ["words"])
);

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
].reduce((acc, speaker) => {
	acc[speaker.substring(0, 1)] = speaker;
	return acc;
}, {} as Record<string, string>);

const speakers = utterances.reduce(
	(acc, utterance) => {
		acc[utterance.speaker] = dummySpeakers[utterance.speaker];
		return acc;
	},
	{} as Record<string, string>,
);

const transcription: Transcription = {
	absent: ["Fred Douglas"],
	audioURL: sourceURL,
	date: "2024-11-05 18:30:00-05:00",
	department: "Planning Board",
	organization: "Town of Washington",
	present: ["Mark Florence", "Peter Martin", "Don Revane"],
	speakers,
	subject: "Public Hearing",
	utterances,
	visitors: ["Nick Cashorali"],
};

await s3Client.send(
	new PutObjectCommand({
		Bucket: bucket,
		Key: targetFile,
		Body: JSON.stringify(transcription, null, 2),
		ContentType: "application/json",
	}),
);
