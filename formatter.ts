import { Eta } from "eta";
import { GetObjectCommand } from "s3Client";
import { PutObjectCommand } from "s3Client";
import { S3Client } from "s3Client";
import { Transcription } from "./types.ts";

import { bucket } from "./types.ts";
import { crypto } from "@std/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";
import { parse } from "@std/path/parse";

import dayjs from "dayjs";
import OpenAI from "openai";

const sourceDflt = `September+3+PB+Meeting+Clip.json`;

const sourceFile = prompt(
  "⌨️ Enter transcription JSON to format:",
  sourceDflt,
) as string ?? sourceDflt;

const targetFile = `${parse(sourceFile).name}.html`;

const s3Client = new S3Client({});

const openai = new OpenAI();

const eta = new Eta({ debug: false, views: Deno.cwd() });

const response = await s3Client.send(
  new GetObjectCommand({
    Bucket: bucket,
    Key: sourceFile,
  }),
);
// @ts-ignore 🔥 who knows why Body isn't allowed?
const str = await response.Body.transformToString();
const transcription: Transcription = JSON.parse(str);

for (const chapter of transcription.chapters) {
  const jammed = [
    "The intended audience is a professional reader. Summarize the following discussion into bullets by using the past tense. Format the response as an HTML fragment.\n",
  ];
  for (let ix = chapter.start; ix <= chapter.end; ix++) {
    jammed.push(
      `${transcription.speakers[transcription.utterances[ix].speaker]} says: ${
        transcription.utterances[ix].text
      }`,
    );
  }
  const b0 = jammed.join("\n");
  const b1 = new TextEncoder().encode(b0);
  const b2 = await crypto.subtle.digest("SHA-256", b1);
  const hash = encodeHex(b2);
  if (hash !== chapter.hash) {
    chapter.hash = hash;

    const encoder = new TextEncoder();
    Deno.stdout.write(
      encoder.encode(`👉 Summarizing chapter ${chapter.title}.`),
    );
    const timerID = setInterval(() => {
      Deno.stdout.write(encoder.encode("."));
    }, 100);

    const response = await openai.chat.completions.create({
      messages: [{ role: "user", content: b0 }],
      model: "gpt-4o",
    });
    clearInterval(timerID);
    Deno.stdout.write(encoder.encode("\n"));

    chapter.summary = response.choices[0].message.content
      .replaceAll("```html", "")
      .replaceAll("```", "");

    console.log(`👉 Saving ${sourceFile}`);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: sourceFile,
        Body: JSON.stringify(transcription, null, 2),
        ContentType: "application/json",
      }),
    );
  }
}

const html = eta.render("./template.eta", { ...transcription, dayjs });

console.log(`👉 Saving ${targetFile}`);
await s3Client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: targetFile,
    Body: html,
    ContentType: "text/html",
  }),
);
