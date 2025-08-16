import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.js',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'healthcare_db',
    port: 3306,
  },
});