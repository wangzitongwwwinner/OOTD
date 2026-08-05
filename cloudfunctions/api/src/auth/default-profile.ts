import { randomInt } from "node:crypto";

export function createDefaultNickname(
  generateNumber: (minimum: number, maximum: number) => number = randomInt,
) {
  return `微信用户${generateNumber(10000, 100000)}`;
}

export function needsDefaultNicknameUpgrade(nickname: string) {
  return nickname === "微信用户";
}
