import mongoose from "mongoose";
import { Database } from "../connectionManager.js";

const conn = await Database.getConnection();

export const $SdkRelease = new mongoose.Schema(
  {
    _id: { type: Date, required: true } /* releasedDate */,
    releaseNote: String,
  },
  { timestamps: true },
);

export const SdkRelease = conn.model("SdkRelease", $SdkRelease);
