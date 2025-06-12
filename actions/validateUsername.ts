"use server";

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { usersTable } from "../src/db/schema";

const db = drizzle(process.env.DATABASE_URL!);

export async function validateUsername(username: string): Promise<boolean> {
  try {
    const takenUsernames = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.userName, username.toLowerCase()));

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return takenUsernames.length === 0;
  } catch (error) {
    console.error(error);
    return false;
  }
}
