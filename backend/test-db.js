const { Client } = require('pg');
const client = new Client({
    connectionString: "postgresql://pmta_user:pmta_password@localhost:5432/pmta_analytics"
});

client.connect()
    .then(() => {
        console.log('✅ Successfully connected to Docker PostgreSQL!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection error', err.stack);
        process.exit(1);
    });
