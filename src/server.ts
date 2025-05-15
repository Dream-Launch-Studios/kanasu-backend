import app from "./app";
import { ENV } from "./config/env";
import prisma from "./config/prisma";

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
