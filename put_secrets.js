const { execSync } = require('child_process');

const secrets = {
  JWT_SECRET: process.env.JWT_SECRET || "",
  ZALO_BOT_TOKEN: process.env.ZALO_BOT_TOKEN || "",
  MMTB_AUTO_LOGIN_PASSWORD: process.env.MMTB_AUTO_LOGIN_PASSWORD || "",
  GDRIVE_PRIVATE_KEY: process.env.GDRIVE_PRIVATE_KEY || ""
};


for (const [key, value] of Object.entries(secrets)) {
  console.log(`Setting secret ${key}...`);
  try {
    execSync(`npx wrangler secret put ${key}`, { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
  } catch (err) {
    console.error(`Failed to set ${key}`, err.message);
  }
}
