import mongoose from "mongoose";
import { Database } from "../connectionManager.js";

const conn = await Database.getConnection();

export const $Aviutl2Release = new mongoose.Schema(
  {
    _id: { type: String, required: true } /* version */,
    zipUrl: { type: String, required: true },
    exeUrl: { type: String, required: true },
    releasedDate: { type: Date, required: true, index: true },
    aviutl2ReleaseNote: String,
    luaReleaseNote: String,
  },
  { timestamps: true },
);

export const Aviutl2Release = conn.model("Aviutl2Release", $Aviutl2Release);
