import mongoose from 'mongoose';

export async function connect_to_db() {
    try {
        const URI = process.env.MONGODB_URI;
        if (!URI) throw new Error("No MONGODB_URI provided");
        await mongoose.connect(URI)
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Could not connect to MongoDB")
        console.error(err)
    }
}