"use server";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

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
