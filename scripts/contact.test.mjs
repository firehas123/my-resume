import { test } from "node:test";
import assert from "node:assert/strict";
import { contactEmail, handleContact, validateContact } from "./lib/contact.mjs";

const good = { name: "Ada Lovelace", email: "ada@example.com", message: "Hello, I would like to talk about a role.", language: "English, en", captcha: "token" };

/** Fake outside world that records what happened. */
function world({ captcha = true, slot = true, sendFails = false } = {}) {
  const calls = { verify: [], sent: [], slots: 0 };
  return {
    calls,
    deps: {
      verifyCaptcha: async (token) => (calls.verify.push(token), captcha),
      takeDailySlot: async () => (calls.slots++, slot),
      send: async (mail) => {
        if (sendFails) throw new Error("down");
        calls.sent.push(mail);
      },
    },
  };
}

test("validation codes", () => {
  assert.deepEqual(validateContact({ name: " ", email: "x@", message: "short" }), { name: "missing", email: "invalid", message: "short" });
  assert.deepEqual(validateContact({ name: "A".repeat(101), email: "", message: "x".repeat(5001) }), { name: "long", email: "missing", message: "long" });
  assert.deepEqual(validateContact(good), {});
});

test("a valid message with a real captcha answer is sent, replying to the visitor", async () => {
  const { calls, deps } = world();
  const result = await handleContact(good, deps);
  assert.deepEqual(result, { status: 200, body: { success: true } });
  assert.equal(calls.sent.length, 1);
  assert.equal(calls.sent[0].replyTo, "ada@example.com");
  assert.equal(calls.sent[0].subject, "New message from your website (English, en)");
  assert.match(calls.sent[0].text, /Language: English, en/);
});

test("no captcha answer: rejected, nothing counted or sent", async () => {
  const { calls, deps } = world();
  const result = await handleContact({ ...good, captcha: undefined }, deps);
  assert.equal(result.body.error, "captcha");
  assert.equal(calls.verify.length, 0);
  assert.equal(calls.slots, 0);
  assert.equal(calls.sent.length, 0);
});

test("a fake captcha answer is rejected", async () => {
  const { calls, deps } = world({ captcha: false });
  const result = await handleContact(good, deps);
  assert.deepEqual(result, { status: 400, body: { success: false, error: "captcha" } });
  assert.equal(calls.sent.length, 0);
});

test("invalid fields are rejected before the captcha is even checked", async () => {
  const { calls, deps } = world();
  const result = await handleContact({ ...good, email: "nope" }, deps);
  assert.equal(result.body.error, "invalid");
  assert.equal(calls.verify.length, 0);
});

test("honeypot: looks successful, sends nothing", async () => {
  const { calls, deps } = world();
  const result = await handleContact({ ...good, botcheck: true }, deps);
  assert.equal(result.body.success, true);
  assert.equal(calls.sent.length, 0);
});

test("daily limit reached: 429, nothing sent", async () => {
  const { calls, deps } = world({ slot: false });
  assert.equal((await handleContact(good, deps)).status, 429);
  assert.equal(calls.sent.length, 0);
});

test("delivery failure is reported", async () => {
  const { deps } = world({ sendFails: true });
  assert.deepEqual(await handleContact(good, deps), { status: 502, body: { success: false, error: "send" } });
});

test("wrong types never crash the handler", async () => {
  const { deps } = world();
  assert.equal((await handleContact(null, deps)).status, 400);
  assert.equal((await handleContact({ name: 5, email: [], message: {} }, deps)).status, 400);
});

test("email text", () => {
  const mail = contactEmail({ name: "A", email: "a@b.c", message: "Hi", language: "" });
  assert.equal(mail.subject, "New message from your website");
  assert.equal(mail.text, "Name: A\nEmail: a@b.c\n\nHi");
});
