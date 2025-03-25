import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Handle POST requests
export async function POST(req: Request) {
  try {
    const { id, email, name, image } = await req.json();
    console.log("I AM SUPERMAN : ",{ id, email, name, image });

    // Check if the user already exists
    const existingUser = await db.user.findUnique({ where: { id } });

    if (!existingUser) {
      // Insert new user into the database
    const user_1 =  await db.user.create({
        data: {
          id,
          email:email,
          name,
          ProfileImage: image, // Ensure the field name matches your DB schema
        },
      });
      console.log("user", user_1);
    }
  
    return NextResponse.json({ message: "User saved successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error saving user", error }, { status: 500 });
  }
}
