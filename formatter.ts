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

// 🔥 the JSON input and HTML output files are relative to
//    this S3 { bucket }

// 👉 default used for testing; keep it as a template for data entry
const sourceDflt = `September+3+PB+Meeting+Clip.json`;

// 👇 solicit the JSON data file

const sourceFile = prompt(
  "⌨️ Enter transcription JSON to format:",
  sourceDflt,
) as string ?? sourceDflt;

// 👉 HTML output file
const targetFile = `${parse(sourceFile).name}.html`;

// 👉 S3 client to read and write into bucket
const s3Client = new S3Client({});

// 👉 OpenAI to produce summary from transcript
const openai = new OpenAI();

// 👉 ETA templating engine to produce HTML from JSON
const eta = new Eta({ debug: false, views: Deno.cwd() });

// 👇 get the JSON transcription
//    see transcriber.ts

const response = await s3Client.send(
  new GetObjectCommand({
    Bucket: bucket,
    Key: sourceFile,
  }),
);
// @ts-ignore 🔥 who knows why Body isn't allowed?
const str = await response.Body.transformToString();
const transcription: Transcription = JSON.parse(str);

// 👇 for every chapter in the transcription ...
// 🔥 chapters are constructed manually!!

for (const chapter of transcription.chapters) {
  // 👇 join all the utterances together in the form of an OpenAI
  //    request -- also doubles as a way to tell if the transcription
  //    has changed siunce we last ran

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

  // 👇 compute a hash of the transcription

  const b0 = jammed.join("\n");
  const b1 = new TextEncoder().encode(b0);
  const b2 = await crypto.subtle.digest("SHA-256", b1);
  const hash = encodeHex(b2);

  // 👇 if the hash has changed, the transcription has changed
  //    also triggered first time of course!

  if (hash !== chapter.hash) {
    chapter.hash = hash;

    // 👇 these dots signify a long-running operation in the CLI

    const encoder = new TextEncoder();
    Deno.stdout.write(
      encoder.encode(`👉 Summarizing chapter ${chapter.title}.`),
    );
    const timerID = setInterval(() => {
      Deno.stdout.write(encoder.encode("."));
    }, 100);

    // 👇 ask OpenAI to produce a summary from the transcription

    const response = await openai.chat.completions.create({
      messages: [{ role: "user", content: b0 }],
      model: "gpt-4o",
    });
    clearInterval(timerID);
    Deno.stdout.write(encoder.encode("\n"));

    // 🔥 ugh! no idea how to suppress this crap

    chapter.summary = response.choices[0].message.content
      .replaceAll("```html", "")
      .replaceAll("```", "");

    // 👇 save the JSON with the new summary

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

// 👇 organize consistent colors

const colorMap = {
  accent: "#002a86",
  black: "#313638",
  gray8: "#808080",
  gray9: "#909090",
  gray10: "#a0a0a0",
  gray11: "#b0b0b0",
  gray12: "#c0c0c0",
  gray13: "#d0d0d0",
  gray14: "#e0e0e0",
  gray15: "#f0f0f0",
  primary: "rgba(33, 150, 243, 1.0)",
  white: "#faf9f6",
};

// 👇 render the HTML from the ETA template

const html = eta.render("./template.eta", {
  ...transcription,
  $dayjs: dayjs,
  $colorMap: colorMap,
});

// 👇 we're done!
//    save the HTML into its S3 bucket

console.log(`👉 Saving ${targetFile}`);
await s3Client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: targetFile,
    Body: html,
    ContentType: "text/html",
  }),
);
