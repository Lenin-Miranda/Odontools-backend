const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server"); // importa la app sin listen()

describe("Auth API", () => {
  beforeAll(async () => {
    const MONGO_URI = "mongodb://127.0.0.1:27017/odontools-test";
    await mongoose.connect(MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase(); // limpia la DB de pruebas
    await mongoose.connection.close();
  });

  test("Debe registrar un nuevo usuario", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "123456",
      isAdmin: true,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe("test@example.com");
  });

  test("Debe iniciar sesion y devolver un token JWT", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "123456",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.isAdmin).toBe(true);
  });

  test("Debe proteger la ruta /me y devolver los datos del usuario", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "123456",
    });

    const token = loginRes.body.token;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("email", "test@example.com");
    expect(res.body.user).toHaveProperty("isAdmin", true);
  });
});
