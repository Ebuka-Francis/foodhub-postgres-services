import express, { Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4003;

// --- ORDER ROUTES ---

// Get all orders (including their order items)
app.get("/api/orders", async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/orders/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id); // Explicitly cast to string
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new order with items linked to vendors and products
app.post("/api/orders", async (req: Request, res: Response) => {
  try {
    const { userId, totalAmount, items } = req.body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "userId and an array of items are required" });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: parseFloat(totalAmount),
        status: "PENDING",
        items: {
          create: items.map((item: { productId: string; vendorId: string; quantity: number; price: number }) => ({
            productId: item.productId,
            vendorId: item.vendorId, // Explicitly tracking which vendor owns this item
            quantity: parseInt(item.quantity as any),
            price: parseFloat(item.price as any),
          })),
        },
      },
      include: { items: true },
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/orders/:id/status", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id); // Explicitly cast to string
    const { status } = req.body;

    const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    return res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});