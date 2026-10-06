import { db } from './db';
import { createRepository } from './repository';

export const repo = createRepository(db);
export { db };
