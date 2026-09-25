import { rmSync } from 'node:fs';
import { join } from 'node:path';

for (const dir of ['node_modules/.vite', '.astro']) {
	try {
		rmSync(join(process.cwd(), dir), { recursive: true, force: true });
		console.log(`removed ${dir}`);
	} catch {
		/* ignore */
	}
}
