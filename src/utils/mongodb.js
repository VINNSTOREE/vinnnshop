const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const uri = 'mongodb+srv://vinnaja619:bID81oPBSTmXtLu4@cluster0.8jy4aze.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'qrisdb' // Ganti nama DB kalau perlu
    });

    isConnected = conn.connections[0].readyState;
    console.log('✅ MongoDB connected:', conn.connection.host);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
};

module.exports = connectDB;
