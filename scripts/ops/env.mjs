import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

export function loadLocalEnv(cwd = process.cwd()) {
  const candidates = ['.env.local', '.env', '.env.save'];

  for (const file of candidates) {
    const fullPath = path.join(cwd, file);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath, override: false });
    }
  }
}
