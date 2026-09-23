import 'dotenv/config';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    // Without this, mysql2 hands back DATE columns as JS Date objects, which get a
    // timezone-based time-of-day bolted on (e.g. 2023-04-12 becomes "...T05:00:00.000Z")
    // and can even shift to the wrong calendar day. Keep them as plain "YYYY-MM-DD" strings.
    dateStrings: true
});

// FIX FROM CLAUDE: Removed the "connected" listener -- pools connect lazily on first query (no connect 
// event to hook), and this code was broken 3 ways: pool.once() returns the pool not a Promise (so .catch() 
// crashed on startup), 'open' isn't a real event, and it called release() on a Connection that was never 
// created; DB errors still surface normally the moment a query runs 
// (e.g. behaviorsModel.mjs/appointmentsModel.mjs).
export default pool;