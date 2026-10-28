require("dotenv").config();

const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    // Most hosted MySQL services (Aiven, PlanetScale, Railway...) require SSL.
    // Set DB_SSL=true in your host's environment variables to enable it.
    ssl: process.env.DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined
});

module.exports = db;
