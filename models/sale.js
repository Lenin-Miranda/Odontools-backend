const mongoose = require("mongoose");

const SALE_STATUS = [
  "pendiente",
  "confirmado",
  "enviado",
  "entregado",
  "cancelado",
];
const PAYMENT_METHODS = ["cash", "bank_transfer"];
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
    accountName: {
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

module.exports = mongoose.model("Sale", saleSchema);
