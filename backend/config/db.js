import mongoose from "mongoose";

export async function db() {
    await mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("Connecté à MongoDB ✅"))
        .catch(err => console.error("Erreur ", err));
}