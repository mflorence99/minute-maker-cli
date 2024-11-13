import { AssemblyAI } from "assemblyai";
import { PutObjectCommand } from "s3Client";
import { S3Client } from "s3Client";
import { Transcription } from "./types.ts";

import { bucket } from "./types.ts";
import { omit } from "@std/collections";
import { parse } from "@std/path/parse";

const sourceDflt = `September+3+PB+Meeting+Clip.mp3`;

const sourceFile = prompt(
	"👉 Enter audio file to transcribe:",
	sourceDflt,
) as string ?? sourceDflt;

const sourceURL = `https://${bucket}.s3.us-east-1.amazonaws.com/${sourceFile}`;

const targetFile = `${parse(sourceFile).name}.json`;

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
});
clearInterval(timerID);
Deno.stdout.write(encoder.encode("\n"));

if (transcript.status === "error") {
	console.error(`🔥 Transcription failed: ${transcript.error}`);
	Deno.exit(1);
} else console.log("👉 Transcription completed");

const transcription: Transcription = {
	absent: [],
	audioURL: sourceURL,
	date: "",
	department: "",
	organization: "Town of Washington",
	present: [],
	speakers: {},
	subject: "",
	utterances: (transcript?.utterances ?? []).map((u) => omit(u, ["words"])),
	visitors: [],
};

await s3Client.send(
	new PutObjectCommand({
		Bucket: bucket,
		Key: targetFile,
		Body: JSON.stringify(transcription, null, 2),
		ContentType: "application/json",
	}),
);
