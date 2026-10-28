
const { MongoClient } = require('mongodb');

async function main() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const database = client.db('mydatabase');
        const collection = database.collection('mycollection');

        const result = await collection.insertOne({
            name: 'John',
            age: 30,
            city: 'New York'
        });

        console.log(`Document inserted with id: ${result.insertedId}`);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
