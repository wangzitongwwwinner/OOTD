import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("场景温度使用原型同款单路径温度计图标", async () => {
  const icon = await readFile(
    "miniprogram/src/assets/icons/thermometer.svg",
    "utf8",
  );

  assert.match(icon, /viewBox="0 0 24 24"/);
  assert.match(icon, /d="M14 4v10\.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/);
  assert.equal((icon.match(/<path\b/g) ?? []).length, 1);
  assert.doesNotMatch(icon, /<line\b/);
});
