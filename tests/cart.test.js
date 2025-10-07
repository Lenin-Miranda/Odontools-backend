const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server"); // importa la app sin listen()
const Product = require("../models/products");

describe("Cart API", () => {
  let adminToken;
  beforeAll(async () => {
    const MONGO_URI = "mongodb://localhost:27017/odontools-test";
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    //Crear un usuario admin para crear productos
    await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: `adminuser@example.com`,
      password: "password123",
      isAdmin: true,
    });
    const loginRes = await request(app).post("/api/auth/login").send({
      email: `adminuser@example.com`,
      password: "password123",
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
  let productId;

  test("Debe agregar un producto al carrito", async () => {
    // Primero, crea un usuario y un producto para usar en el carrito

    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Cart Test Product",
        description: "This is a test product for cart",
        price: 29.99,
        stock: 100,
        image: "http://example.com/cart-image.jpg",
        category: "Test category",
      });
    productId = productRes.body.product._id;

    // Ahora, agrega el producto al carrito
    const cartRes = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productId: productId,
        quantity: 2,
      });

    expect(cartRes.statusCode).toBe(200);
    expect(cartRes.body).toHaveProperty("cart");
    expect(cartRes.body.cart.items.length).toBe(1);
    expect(cartRes.body.cart.items[0].product._id).toBe(productId);
    expect(cartRes.body.cart.items[0]).toHaveProperty("quantity", 2);
  });

  test("Debe obtener el carrito del usuario", async () => {
    const cartRes = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(cartRes.statusCode).toBe(200);
    expect(cartRes.body).toHaveProperty("cart");
    expect(cartRes.body.cart.items.length).toBe(1);
    expect(cartRes.body.cart.items[0].product._id).toBe(productId);
    expect(cartRes.body.cart.items[0]).toHaveProperty("quantity", 2);
  });

  test("Debe eliminar un producto del carrito", async () => {
    const cartRes = await request(app)
      .delete(`/api/cart/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(cartRes.statusCode).toBe(200);
    expect(cartRes.body).toHaveProperty("cart");
    expect(cartRes.body.cart.items.length).toBe(0);
  });

  test("Debe manejar carrito no encontrado", async () => {
    // Crear un usuario diferente que no tenga carrito
    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: `testuser@example.com`,
      password: "password123",
      isAdmin: false,
    });
    const loginRes = await request(app).post("/api/auth/login").send({
      email: `testuser@example.com`,
      password: "password123",
    });
    const testToken = loginRes.body.token;

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Carrito no encontrado");
  });

  test("Debe manejar agregar producto no existente al carrito", async () => {
    const res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productId: new mongoose.Types.ObjectId(), // ID de producto no existente
        quantity: 1,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Producto no encontrado");
  });

  test("Debe incrementar la cantidad de un producto en el carrito", async () => {
    // Crear producto para el carrito

    // Agregar el producto nuevamente al carrito
    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productId: productId,
        quantity: 1,
      });

    // Incrementar la cantidad del producto en el carrito
    const res = await request(app)
      .post(`/api/cart/increase/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productId: productId,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("cart");
    expect(res.body.cart.items.length).toBe(1);
    expect(res.body.cart.items[0].product._id).toBe(productId);
    expect(res.body.cart.items[0]).toHaveProperty("quantity", 2); // Cantidad incrementada a 2
  });

  test("Debe decrementar la cantidad de un producto en el carrito", async () => {
    // Disminuir la cantidad de un producto en el carrito
    const res = await request(app)
      .post(`/api/cart/decrease/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productId: productId,
      });
    console.log("🧪 RESPONSE decreaseItemQuantity:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("cart");
    expect(res.body.cart.items.length).toBe(1);
    expect(res.body.cart.items[0].product._id).toBe(productId);
    expect(res.body.cart.items[0]).toHaveProperty("quantity", 1); // Cantidad decrementada a 1
  });

  test("Debe eliminar el producto del carrito si la cantidad llega a cero", async () => {
    // Disminuir la cantidad de un producto en el carrito a 0
    const res = await request(app)
      .post(`/api/cart/decrease/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productId: productId,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("cart");
    expect(res.body.cart.items.length).toBe(0); // El producto debe ser eliminado del carrito
  });

  test("Debe manejar decremento de producto no existente en el carrito", async () => {
    const res = await request(app)
      .post(`/api/cart/decrease/${new mongoose.Types.ObjectId()}`) // ID de producto no existente en el carrito
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productId: new mongoose.Types.ObjectId(),
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Producto no encontrado en el carrito"
    );
  });

  test("Debe manejar incremento de producto no existente en el carrito", async () => {
    const res = await request(app)
      .post(`/api/cart/increase/${new mongoose.Types.ObjectId()}`) // ID de producto no existente en el carrito
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productId: new mongoose.Types.ObjectId(),
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Producto no encontrado en el carrito"
    );
  });

  test("Debe limpiar el carrito del usuario", async () => {
    const res = await request(app)
      .delete("/api/cart/clear")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Carrito limpiado");
    expect(res.body.cart.items.length).toBe(0);
  });
});
