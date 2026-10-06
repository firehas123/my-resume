// Tests for the README cleaning. Run with `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { plainText, readmeContent, readmeImage } from "./lib/readme.mjs";

const repo = { owner: "me", repo: "demo", branch: "main" };

test("summary is the first real paragraph, as plain text", () => {
  const { summary } = readmeContent(`# Demo

[![Build](https://img.shields.io/badge/build-passing-green)](https://ci)

## Description
The **Demo** app manages [accounts](https://x.y) and keeps \`data\` safe for small teams.

## Installation
1. Clone the repository.`);
  assert.equal(summary, "The Demo app manages accounts and keeps data safe for small teams.");
});

test("boilerplate sections and badges are dropped from the overview", () => {
  const { overview } = readmeContent(`# Demo
![badge](https://img.shields.io/x.svg)
Intro paragraph that explains what this project is about in plain words.

## Features
- Fast
- Small

## Installation
Run npm install.

## Usage
npm start

## License
MIT`);
  assert.match(overview, /Intro paragraph/);
  assert.match(overview, /## Features/);
  assert.doesNotMatch(overview, /Installation|npm install|Usage|License|shields/);
  assert.doesNotMatch(overview, /^# Demo/m);
});

test("raw HTML is removed but its text kept", () => {
  const { overview } = readmeContent(`<p align="center"><img src="logo.png"></p>\n\n<b>Bold</b> project description that has enough words to count as a real sentence.`);
  assert.doesNotMatch(overview, /<|>/);
  assert.match(overview, /Bold project description/);
});

test("metadata-only READMEs give no summary and no overview", () => {
  const result = readmeContent(`# Dots-Game\nAuthor\nHassan Chattha\n31-12-2022\n\nLink to online webPage is:\nhttps://example.netlify.app/`);
  assert.equal(result.summary, "");
  assert.equal(result.overview, "");
  assert.deepEqual(readmeContent(""), { summary: "", overview: "" });
});

test("untouched generator templates (Create React App, Next.js, Vite) are ignored", () => {
  const cra = "# Getting Started with Create React App\n\nThis project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).\n\n## Available Scripts\n\nIn the project directory, you can run npm start.";
  assert.deepEqual(readmeContent(cra), { summary: "", overview: "" });
  assert.deepEqual(readmeContent("This is a [Next.js](https://nextjs.org) project bootstrapped with create-next-app."), { summary: "", overview: "" });
});

test("long summaries are cut at a sentence end", () => {
  const long = "This project does one useful thing very well. ".repeat(10);
  const { summary } = readmeContent(long);
  assert.ok(summary.length <= 240 && summary.endsWith("."), summary);
});

test("first meaningful image: badges skipped, relative paths resolved", () => {
  const md = `[![CI](https://github.com/me/demo/actions/workflows/ci.yml/badge.svg)](x)
![shield](https://img.shields.io/badge/a-b-c)
![Screenshot](docs/screen.png)
![Second](https://example.com/b.jpg)`;
  assert.equal(readmeImage(md, repo), "https://raw.githubusercontent.com/me/demo/main/docs/screen.png");
});

test("html img tags, blob links and user-attachments are understood", () => {
  assert.equal(readmeImage('<img width="600" src="./img/shot.webp">', repo), "https://raw.githubusercontent.com/me/demo/main/img/shot.webp");
  assert.equal(readmeImage("![x](https://github.com/me/demo/blob/main/a.png)", repo), "https://raw.githubusercontent.com/me/demo/main/a.png");
  assert.equal(readmeImage("![x](https://github.com/user-attachments/assets/123-abc)", repo), "https://github.com/user-attachments/assets/123-abc");
});

test("no usable image: svg logos, data URIs and nothing at all", () => {
  assert.equal(readmeImage("![logo](logo.svg)", repo), null);
  assert.equal(readmeImage("![x](data:image/png;base64,AAA)", repo), null);
  assert.equal(readmeImage("# Just text", repo), null);
});

test("plainText", () => {
  assert.equal(plainText("**Bold** _it_ [link](u) `code`"), "Bold it link code");
});
