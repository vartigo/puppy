
const { MongoClient } = require('mongodb');

async function main() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const database = client.db('mydatabase');
        const collection = database.collection('mycollection');

        const documents = await collection.find({}).toArray();

        console.log('Documents:');
        console.log(documents);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
