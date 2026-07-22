import mongoose from "mongoose";

export async function clearDatabase() {
    const collections = mongoose.connection.collections;
    await Promise.all(
        Object.values(collections).map((collection) => collection.deleteMany({}))
    );
}
