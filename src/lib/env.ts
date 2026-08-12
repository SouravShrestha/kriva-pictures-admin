function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export const env = {
  get adminPassword() { return requireEnv("ADMIN_PASSWORD"); },
  get sessionSecret() { return requireEnv("SESSION_SECRET"); },
  get cloudinaryCloudName() { return requireEnv("CLOUDINARY_CLOUD_NAME"); },
  get cloudinaryApiKey() { return requireEnv("CLOUDINARY_API_KEY"); },
  get cloudinaryApiSecret() { return requireEnv("CLOUDINARY_API_SECRET"); },
  get cloudinaryRootFolderTest() { return process.env.CLOUDINARY_ROOT_FOLDER_TEST ?? "test"; },
  get cloudinaryRootFolderProd() { return process.env.CLOUDINARY_ROOT_FOLDER_PROD ?? ""; },
  get siteTestUrl() { return process.env.SITE_TEST_URL ?? ""; },
  get siteProdUrl() { return process.env.SITE_PROD_URL ?? ""; },
};
