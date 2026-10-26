import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const start = async () => {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`HCM Lite backend listening on http://localhost:${config.port}`);
  });
};

start();
