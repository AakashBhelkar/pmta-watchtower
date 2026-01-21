const { Client } = require('pg');
const client = new Client({
    user: 'pmta_user',
    host: 'localhost',
    database: 'pmta_analytics',
    password: 'pmta_password',
    port: 5433,
});

client.connect()
    .then(() => {
        console.log('Connected successfully');
        return client.query('SELECT NOW()');
    })
    .then(res => {
        console.log('Result:', res.rows[0]);
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err.stack);
        process.exit(1);
    });
