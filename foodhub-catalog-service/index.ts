import express, { Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4002;

// --- PRODUCT ROUTES ---

// Get all products (including their vendor details)
app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { vendor: true },
    });
    return res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Create a product linked to a vendor
app.post("/api/products", async (req: Request, res: Response) => {
  try {
    const { name, price, place, quantity, image, description, category, vendorId } = req.body;

    if (!vendorId) {
      return res.status(400).json({ error: "vendorId is required to create a product" });
    }

    // Verify vendor exists first
    const vendorExists = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendorExists) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const product = await prisma.product.create({
      data: { 
        name, 
        price: parseFloat(price), 
        place, 
        quantity: parseInt(quantity), 
        image, 
        description, 
        category, 
        vendorId 
      },
      include: { vendor: true },
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// --- VENDOR ROUTES ---

// Get all vendors
app.get("/api/vendors", async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany();
    return res.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Create a vendor
app.post("/api/vendors", async (req: Request, res: Response) => {
  try {
    const { businessName, ownerName, email, phoneNumber, logo, description, street, city, country, plan } = req.body;
    const vendor = await prisma.vendor.create({
      data: { businessName, ownerName, email, phoneNumber, logo, description, street, city, country, plan: plan || "Starter" }
    });
    return res.status(201).json(vendor);
  } catch (error) {
    console.error("Error creating vendor:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Catalog service running in TypeScript on port ${PORT}`);
});