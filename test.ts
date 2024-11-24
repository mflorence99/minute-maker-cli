import { GetObjectCommand } from "s3Client";
import { PutObjectCommand } from "s3Client";
import { S3Client } from "s3Client";

import { bucket } from "./types.ts";
import { parse } from "@std/path/parse";

import OpenAI from "openai";

// 🔥 the JSON input and HTML output files are relative to
//    this S3 { bucket }

// 👉 default used for testing; keep it as a template for data entry
const sourceDflt = `November 19 PB Hearing (Raw).txt`;

// 👇 solicit the JSON data file

const sourceFile = prompt(
  "⌨️ Enter the raw minutes file to interpret:",
  sourceDflt,
) as string ?? sourceDflt;

// 👉 HTML output file
const targetFile = `${parse(sourceFile).name}.html`;

// 👉 S3 client to read and write into bucket
const s3Client = new S3Client({});

// 👉 OpenAI to produce summary from raw minutes
const openai = new OpenAI();

// 👇 get the JSON transcription
//    see transcriber.ts

const s3Response = await s3Client.send(
  new GetObjectCommand({
    Bucket: bucket,
    Key: sourceFile,
  }),
);
// @ts-ignore 🔥 who knows why Body isn't allowed?
const str = await s3Response.Body.transformToString();

// 👇 these dots signify a long-running operation in the CLI

const encoder = new TextEncoder();
Deno.stdout.write(
  encoder.encode(`👉 Summarizing raw minutes.`),
);
const timerID = setInterval(() => {
  Deno.stdout.write(encoder.encode("."));
}, 100);

// 👇 ask OpenAI to produce a summary from the transcription

const aiResponse = await openai.chat.completions.create({
  messages: [{
    role: "user",
    content:
      `Convert the following text into grammatical English. Break it into short paragraphs. Format the result as HTML.\n\n${str}`,
  }],
  model: "gpt-4o",
});
clearInterval(timerID);
Deno.stdout.write(encoder.encode("\n"));

// 🔥 ugh! no idea how to suppress this crap

const summary = aiResponse.choices[0].message.content
  .replaceAll("```html", "")
  .replaceAll("```", "");

// 👇 we're done!
//    save the HTML into its S3 bucket

console.log(`👉 Saving ${targetFile}`);
await s3Client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: targetFile,
    Body: summary,
    ContentType: "text/html",
  }),
);
