#!/usr/bin/env -S deno run --allow-all
import $ from "@david/dax"; // "dax-sh" in Node

// run a command
await $`echo 5`; // outputs: 5
