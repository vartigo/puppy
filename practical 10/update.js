
const { MongoClient } = require('mongodb');

async function main() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const database = client.db('mydatabase');
        const collection = database.collection('mycollection');

        const result = await collection.updateMany(
            { name: 'John' },
            { $set: { age: 35 } }
        );

        console.log(`${result.modifiedCount} documents updated.`);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
