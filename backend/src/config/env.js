import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb+srv://abdullahansari7463_db_user:Sw4yIJvfAc7KbAb4@cluster0.oy4eqti.mongodb.net/hcm_lite?retryWrites=true&w=majority",
  jwtSecret: process.env.JWT_SECRET || 'saylani_hcm_secret_key_2026_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  adminEmail: process.env.ADMIN_EMAIL || 'admin@saylanihcm.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
  timezone: process.env.COMPANY_TIMEZONE || 'Asia/Karachi',
};
