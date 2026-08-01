import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

function zIndex(path: string, selector: string) {
  const source = readFileSync(resolve(process.cwd(), path), 'utf8');
  const start = source.indexOf(selector);
  const match = source.slice(start, start + 260).match(/z-index:\s*(\d+)/);
  if (start < 0 || !match) throw new Error(`${selector} 未定义 z-index`);
  return Number(match[1]);
}

it('统一登录弹层始终位于业务表单弹层之上', () => {
  const login = zIndex('src/features/auth/LoginPage.scss', '&--modal');
  const sceneForm = zIndex('src/features/scenes/SceneForm.scss', '&__backdrop');
  expect(login).toBeGreaterThan(sceneForm);
});
