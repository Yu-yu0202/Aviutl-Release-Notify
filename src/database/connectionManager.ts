import { ENV } from "../__env__.js";
import mongoose from "mongoose";

export class Database {
  private static conn?: mongoose.Connection;

  private static async createConnection(): Promise<mongoose.Connection> {
    this.conn = mongoose.createConnection(ENV.DATABASE_URL, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });

    await this.conn.asPromise();
    return this.conn;
  }

  public static async ensureConnected(): Promise<void> {
    if (this.conn) return;
    await this.createConnection();
  }

  public static async closeConnection(): Promise<void> {
    if (!this.conn) return;

    await this.conn.close();
    this.conn = undefined;

    return;
  }

  public static async getConnection(): Promise<mongoose.Connection> {
    return this.conn ?? (await this.createConnection());
  }
}
