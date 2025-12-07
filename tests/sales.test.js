const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const products = require("../models/products");

describe("Sales API", () => {
  let adminToken;
  beforeAll(async () => {
    const MONGO_URI = "mongodb://localhost:27017/odontools-test";
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: "admin@example.com",
      password: "password",
      isAdmin: true,
    });
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "password",
    });
    adminToken = loginRes.body.token;
  });
  afterAll(async () => {
    try {
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    } catch (error) {
      console.error("Error during afterAll cleanup:", error);
    }
  });

  test("Debe crear una nueva venta", async () => {
    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Sale Test Product",
        description: "This is a test product for sales",
        price: 50,
        stock: 100,
        image: "http://example.com/sale-image.jpg",
        category: "Test category",
      });
    const productId = productRes.body.product._id;

    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productId: productId,
        quantity: 2,
      });

    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        paymentMethod: "credit_card",
        shippingAddress: "123 Test St, Test City",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("sale");
    expect(res.body.sale).toHaveProperty("total", 100);
  });

  test("Debe obtener todas las ventas", async () => {
    const res = await request(app)
      .get("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("sales");
    expect(Array.isArray(res.body.sales)).toBe(true);
  });
  test("Debe obtener una venta por ID", async () => {
    const salesRes = await request(app)
      .get("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`);
    const saleId = salesRes.body.sales[0]._id;

    const res = await request(app)
      .get(`/api/sales/${saleId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("sale");
    expect(res.body.sale).toHaveProperty("_id", saleId);
  });

  test("Debe actualizar el estado de una venta", async () => {
    const salesRes = await request(app)
      .get("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`);

    const saleId = salesRes.body.sales[0]._id;

    const res = await request(app)
      .put(`/api/sales/${saleId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "shipped" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("sale");
    expect(res.body.sale).toHaveProperty("status", "shipped");
  });

  test("Debe manejar venta no encontrada", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/sales/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Venta no encontrada");
  });

  test("Debe exportar ventas a csv", async () => {
    const res = await request(app)
      .get("/api/sales/export")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("text/csv; charset=utf-8");
  });

  test("Debe exportar una venta específica a csv", async () => {
    const salesRes = await request(app)
      .get("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`);

    const saleId = salesRes.body.sales[0]._id;

    const res = await request(app)
      .get(`/api/sales/export/${saleId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("text/csv; charset=utf-8");
  });
});
