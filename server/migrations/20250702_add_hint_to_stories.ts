import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../server/db';

// Add a nullable hint column to the stories table
export async function up() {
  await db.execute(`ALTER TABLE stories ADD COLUMN hint TEXT;`);
}

// Remove the hint column if rolling back
export async function down() {
  await db.execute(`ALTER TABLE stories DROP COLUMN hint;`);
}

// To run: import and call up() in a migration script
