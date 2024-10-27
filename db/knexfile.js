// db/knexfile.js
require('dotenv').config({ path: '../.env' }); // Adjusted path for Windows

module.exports = {
    development: {
        client: 'postgresql',
        connection: {
            connectionString: 'postgresql://smartbrain_facialdetection_database_owner:uYyI92kfqOFj@ep-jolly-resonance-a1c7qbya.ap-southeast-1.aws.neon.tech/smartbrain_facialdetection_database?sslmode=require',
            ssl: {
                require: true,
                rejectUnauthorized: true
            }
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    }
};