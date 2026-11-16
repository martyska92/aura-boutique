const fs = require("fs");
const os = require("os");
const path = require("path");

async function checkOrder() {
  const tmpPath = path.join(os.tmpdir(), "aura-store-storage.json");
  console.log("Checking path:", tmpPath);
  if (fs.existsSync(tmpPath)) {
    const raw = fs.readFileSync(tmpPath, "utf-8");
    const data = JSON.parse(raw);
    console.log("Orders count in JSON:", data.orders?.length || 0);
    for (const o of data.orders || []) {
      console.log(`- Order: id=${o.id}, num=${o.orderNumber}, total=${o.totalAmount}, accessKey=${o.accessKey}`);
    }
  } else {
    console.log("File does not exist!");
  }

  // Also check Prisma DB if DATABASE_URL is set in .env
  require("dotenv").config();
  if (process.env.DATABASE_URL) {
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      const count = await prisma.order.count();
      console.log("Orders count in Prisma:", count);
      const orders = await prisma.order.findMany({ take: 10 });
      for (const o of orders) {
        console.log(`- Prisma Order: id=${o.id}, num=${o.orderNumber}, total=${o.totalAmount}`);
      }
      await prisma.$disconnect();
    } catch (e) {
      console.log("Prisma connection error:", e.message);
    }
  } else {
    console.log("No DATABASE_URL in environment.");
  }
}

checkOrder();
