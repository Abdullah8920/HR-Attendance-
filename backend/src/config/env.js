import dotenv from 'dotenv';
dotenv.config();

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  adminEmail: process.env.ADMIN_EMAIL || 'admin@saylanihcm.com',
  adminPassword: process.env.ADMIN_PASSWORD,
  timezone: process.env.COMPANY_TIMEZONE || 'Asia/Karachi',
};
