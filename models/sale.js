const mongoose = require("mongoose");

const SALE_STATUS = [
  "pendiente",
  "confirmado",
  "enviado",
  "entregado",
  "cancelado",
];
const PAYMENT_METHODS = ["cash", "bank_transfer"];
const SHIPPING_TYPES = [
  { type: "Cargotrans", label: "Cargotrans 24-48 horas", cost: 0 },
  { type: "Estandar", label: "Envio Estandar 24 horas", cost: 150 },
  { type: "Express", label: "Envio Express 1-2 horas", cost: 300 },
];

const saleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bankAccountNumber: {
      type: Number,
      trim: true,
      maxlength: 20,
    },
    BankAccountName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        priceAtSale: { type: Number, required: true },
        subtotal: { type: Number, required: true }, // priceAtSale * quantity
        stockAtSale: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },

    shippingType: {
      type: String,
      enum: SHIPPING_TYPES.map((s) => s.type),
      required: true,
    },
    shippingCost: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    shippingAddress: { type: String, required: true },
    status: { type: String, enum: SALE_STATUS, default: "pendiente" },
    saleDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = {
  Sale: mongoose.model("Sale", saleSchema),
  SHIPPING_TYPES,
};
