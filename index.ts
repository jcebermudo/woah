import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

async function main() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not defined');
    const client = postgres(process.env.DATABASE_URL!, { prepare: false })
    const db = drizzle({ client });
}

main();
