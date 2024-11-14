import { Eta } from "eta";
import { GetObjectCommand } from "s3Client";
import { PutObjectCommand } from "s3Client";
import { S3Client } from "s3Client";
import { Transcription } from "./types.ts";

import { bucket } from "./types.ts";
import { parse } from "@std/path/parse";

import dayjs from "dayjs";

const sourceDflt = `September+3+PB+Meeting+Clip.json`;

const sourceFile = prompt(
  "👉 Enter transcription JSON to format:",
  sourceDflt,
) as string ?? sourceDflt;

const targetFile = `${parse(sourceFile).name}.html`;

const s3Client = new S3Client({});

const eta = new Eta({ debug: true, views: Deno.cwd() });
const decoder = new TextDecoder("utf-8");

const css = await Deno.readFile(`${Deno.cwd()}/template.css`);
eta.loadTemplate("@css", decoder.decode(css));

const javascript = await Deno.readFile(`${Deno.cwd()}/template.ts`);
eta.loadTemplate(
  "@javascript",
  decoder.decode(javascript).replaceAll(/^import.*;/g, ""),
);

const response = await s3Client.send(
  new GetObjectCommand({
    Bucket: bucket,
    Key: sourceFile,
  }),
);
// @ts-ignore 🔥 who knows why Body isn't allowed?
const str = await response.Body.transformToString();
const transcription: Transcription = JSON.parse(str);

const html = eta.render("./template.eta", { ...transcription, dayjs });

await s3Client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: targetFile,
    Body: html,
    ContentType: "text/html",
  }),
);
