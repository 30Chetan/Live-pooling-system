import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log("🔄 Connecting to:", process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB Connected:", conn.connection.host);
  } catch (error) {
    console.error("❌ Mongo Error:", error);
    process.exit(1);
  }
};

export default connectDB;