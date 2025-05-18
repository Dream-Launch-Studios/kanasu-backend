import app from "./app.js";
import { ENV } from "./config/env.js";
import prisma from "./config/prisma.js";

async function testDBConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connection successful!");
  } catch (err) {
    //@ts-ignore
    console.error("❌ Failed to connect to the database:", err.message);
  }
}

testDBConnection();

app.listen(ENV.PORT, () => {
  console.log(`🚀 Server running on port ${ENV.PORT}`);
});
