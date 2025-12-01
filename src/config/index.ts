import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });


const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is missing!`);
  }
  return value;
};

export default {
  node_env: requireEnv("NODE_ENV"),
  port: requireEnv("PORT"),
  database_url: requireEnv("DATABASE_URL"),
  FRONTEND_URL: requireEnv("FRONTEND_URL"),

  cloudinary: {
    api_secret: requireEnv("CLOUDINARY_API_SECRET"),
    cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: requireEnv("CLOUDINARY_API_KEY"),
  },


  EMAIL_SENDER: {
    SMTP_USER: requireEnv("SMTP_USER"),
    SMTP_PASS: requireEnv("SMTP_PASS"),
    SMTP_HOST: requireEnv("SMTP_HOST"),
    SMTP_PORT: requireEnv("SMTP_PORT"),
    SMTP_FROM: requireEnv("SMTP_FROM"),
  },

  jwt: {
    jwt_secret: requireEnv("JWT_SECRET"),
    expires_in: requireEnv("EXPIRES_IN"),
    refresh_token_secret: requireEnv("REFRESH_TOKEN_SECRET"),
    refresh_token_expires_in: requireEnv("REFRESH_TOKEN_EXPIRES_IN"),
    reset_pass_secret: requireEnv("RESET_PASS_TOKEN"),
    reset_pass_token_expires_in: requireEnv("RESET_PASS_TOKEN_EXPIRES_IN"),
  },

  ssl: {
    store_id: requireEnv("SSL_STORE_ID"),
    store_pass: requireEnv("SSL_STORE_PASS"),
    payment_api: requireEnv("SSL_PAYMENT_API"),
    validation_api: requireEnv("SSL_VALIDATION_API"),
    ipn_url: requireEnv("SSL_IPN_URL"),
    success_backend_url: requireEnv("SSL_SUCCESS_BACKEND_URL"),
    fail_backend_url: requireEnv("SSL_FAIL_BACKEND_URL"),
    cancel_backend_url: requireEnv("SSL_CANCEL_BACKEND_URL"),
    success_frontend_url: requireEnv("SSL_SUCCESS_FRONTEND_URL"),
    fail_frontend_url: requireEnv("SSL_FAIL_FRONTEND_URL"),
    cancel_frontend_url: requireEnv("SSL_CANCEL_FRONTEND_URL"),
  },

  salt_round: requireEnv("SALT_ROUND"),
  admin_email: requireEnv("ADMIN_EMAIL"),
  admin_password: requireEnv("ADMIN_PASSWORD"),
  reset_pass_link: requireEnv("RESET_PASS_LINK"),
};
