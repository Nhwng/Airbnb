require("dotenv").config();
const cron = require('node-cron');
const express = require("express");
const cors = require("cors");
const connectWithDB = require("./config/db");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const cloudinary = require("cloudinary").v2;
const path = require('path');
const { exec } = require('child_process');
// connect with database
connectWithDB();

// cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// For handling cookies
app.use(cookieParser());

// Initialize cookie-session middleware
app.use(
  cookieSession({
    name: "session",
    maxAge: process.env.COOKIE_TIME * 24 * 60 * 60 * 1000,
    keys: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === 'production' && process.env.HTTPS_ENABLED === 'true', // Only use secure in production with HTTPS
    sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // Use lax for development
    httpOnly: true, // Makes the cookie accessible only on the server-side
  })
);

// middleware to handle json
app.use(express.json());

// CORS - Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:5173',           // Local development
  'http://localhost:3000',           // Alternative local port
  'http://youcandoit.space:5173',    // Production domain
  'https://youcandoit.space:5173',   // HTTPS version
  'http://54.196.197.172:5173',      // EC2 IP address
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// use express router
app.use("/", require("./routes"));

// Data sync cron job (existing)
cron.schedule('0 2 * * *', () => {
  console.log('Running scheduled data sync at ' + new Date().toLocaleString());
  
  const today = new Date();
  const checkIn = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 5);
  const checkOut = futureDate.toISOString().split('T')[0];
  
  const scriptPath = path.join(__dirname, 'scripts/scrape_data.py');
  exec(`python ${scriptPath} ${checkIn} ${checkOut}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Cron error: ${error}`);
      return;
    }
    console.log(`Cron stdout: ${stdout}`);
    if (stderr) {
      console.error(`Cron stderr: ${stderr}`);
    }
  });
});

// Auction processing cron job (NEW) - runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('🔄 Running auction processing at ' + new Date().toLocaleString());
    const { processEndedAuctions } = require('./controllers/auctionController');
    await processEndedAuctions();
  } catch (error) {
    console.error('❌ Cron job error in auction processing:', error);
  }
});
app.listen(process.env.PORT || 8000, (err) => {
  if (err) {
    console.log("Error in connecting to server: ", err);
  }
  console.log(`Server is running on port no. ${process.env.PORT}`);
});

module.exports = app;
