const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");

describe("Product API", () => {
  beforeAll(async () => {
    const MONGO_URI = "mongodb://localhost:27017/odontools-test";
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: "adminuser@example.com",
      password: "password123",
      isAdmin: true,
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "adminuser@example.com",
      password: "password123",
    });

    adminToken = loginRes.body.token;
  });
  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  test("Debe obtener todos los productos", async () => {
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("products");
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  test("Debe crear un nuevo producto", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Product",
        description: "This is a test product",
        price: 19.99,
        stock: 100,
        image: "http://example.com/image.jpg",
        category: "Test category",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("product");
    expect(res.body.product).toHaveProperty("name", "Test Product");
  });

  test("Debe eliminar un producto", async () => {
    const newProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Product to Delete",
        description: "This product will be deleted",
        price: 9.99,
        stock: 50,
        image: "http://example.com/image.jpg",
        category: "Test category",
      });

    const productId = newProductRes.body.product._id;

    const deleteRes = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body).toHaveProperty(
      "message",
      "Producto eliminado exitosamente"
    );

    const getRes = await request(app).get(`/api/products/${productId}`);
    expect(getRes.statusCode).toBe(404);
    expect(getRes.body).toHaveProperty("message", "Producto no encontrado");
  });

  test("Debe actualizar un producto", async () => {
    const newProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Product to Update",
        description: "This product will be updated",
        price: 29.99,
        stock: 75,
        image: "http://example.com/image.jpg",
        category: "Test category",
      });

    const productId = newProductRes.body.product._id;

    const updateRes = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 24.99, stock: 80 });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.product).toHaveProperty("price", 24.99);
    expect(updateRes.body.product).toHaveProperty("stock", 80);
  });

  test("Debe obtener un producto por ID", async () => {
    const newProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Product to Get",
        description: "This product will be retrieved by ID",
        price: 14.99,
        stock: 60,
        image: "http://example.com/image.jpg",
        category: "Test category",
      });

    const productId = newProductRes.body.product._id;

    const getRes = await request(app).get(`/api/products/${productId}`);
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.product).toHaveProperty("name", "Product to Get");
  });

  test("Debe manejar producto no encontrado", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Producto no encontrado");
  });

  test("Debe manejar producto sin nombre", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        description: "Missing name field",
        price: 19.99,
        stock: 100,
        image: "http://example.com/image.jpg",
        category: "Test category",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Faltan los siguientes campos: name"
    );
  });

  test("Debe manejar producto con precio negativo", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("Content-Type", "application/json")
      .send({
        name: "Invalid Price Product",
        description: "This product has a negative price",
        price: -10.0,
        stock: 50,
        image: "http://example.com/image.jpg",
        category: "Test category",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "El precio y el stock no deben de ser negativos"
    );
  });

  test("Debe manejar prodcto con stock negativo", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("Content-Type", "application/json")
      .send({
        name: "Invalid Stock Product",
        description: "This product has a negative stock",
        price: 10.0,
        stock: -5,
        image: "http://example.com/image.jpg",
        category: "Test category",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "El precio y el stock no deben de ser negativos"
    );
  });

  test("Debe manejar actualizacion de producto no encontrado", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/products/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 24.99, stock: 80 });
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Producto no encontrado");
  });

  test("Debe manejar eliminacion de producto no encontrado", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/products/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Producto no encontrado");
  });

  test("Debe manejar creacion de producto sin token", async () => {
    const res = await request(app).post("/api/products").send({
      name: "No Auth Product",
      description: "This product creation should fail",
      price: 19.99,
      stock: 100,
      image: "http://example.com/image.jpg",
      category: "Test category",
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "No se proporcionó token");
  });

  test("Debe manejar creacion de producto con token invalido", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer invalidtoken`)
      .send({
        name: "Invalid Token Product",
        description: "This product creation should fail",
        price: 19.99,
        stock: 100,
        image: "http://example.com/image.jpg",
        category: "Test category",
      });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Token inválido");
  });
});
