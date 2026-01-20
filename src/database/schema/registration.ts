import mongoose from "mongoose";
import { Database } from "../connectionManager.js";

const conn = await Database.getConnection();

export const $Registration = new mongoose.Schema(
  {
    _id: { type: String, required: true } /* channelId */,
  },
  { timestamps: true },
);

export const Registration = conn.model("Registration", $Registration);
