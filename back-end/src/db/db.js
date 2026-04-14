import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

import logger from '../utils/logger.js';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
}

export const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    logger.info('Database pool connected.');
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle database client', err);
    process.exit(-1);
});

export const db = drizzle(pool, { schema });