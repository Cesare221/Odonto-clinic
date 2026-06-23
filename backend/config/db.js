import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = globalThis.process?.env?.MONGODB_URI || globalThis.process?.env?.MONGO_URI;
    if (!uri) {
      throw new Error('MongoDB URI não configurada (use MONGODB_URI ou MONGO_URI).');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Atlas conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erro ao conectar no MongoDB Atlas:', error.message);
    globalThis.process.exit(1);
  }
};

export default connectDB;
