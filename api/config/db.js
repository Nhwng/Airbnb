const mongoose = require('mongoose');

const connectWithDB = () => {
  mongoose.set('strictQuery', false);

  const uri = process.env.DB_URL;
  console.log("DB_URL:", uri); // debug xem có đúng không

  if (!uri) {
    console.error("Missing DB_URL in environment variables");
    process.exit(1);
  }

  mongoose
    .connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("DB connected successfully");
    })
    .catch((err) => {
      console.log("DB connection failed");
      console.log(err.message);
      process.exit(1);
    });
};

module.exports = connectWithDB;
