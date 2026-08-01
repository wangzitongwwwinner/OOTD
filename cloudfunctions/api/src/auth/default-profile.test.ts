import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultNickname,
  needsDefaultNicknameUpgrade,
} from "./default-profile.ts";

test("默认昵称使用微信用户加五位随机数字", () => {
  assert.equal(
    createDefaultNickname(() => 12138),
    "微信用户12138",
  );
  assert.match(
    createDefaultNickname(() => 99999),
    /^微信用户\d{5}$/,
  );
});

test("仅旧版占位昵称需要在登录时升级", () => {
  assert.equal(needsDefaultNicknameUpgrade("微信用户"), true);
  assert.equal(needsDefaultNicknameUpgrade("微信用户12138"), false);
  assert.equal(needsDefaultNicknameUpgrade("皓皓尘埃"), false);
});
