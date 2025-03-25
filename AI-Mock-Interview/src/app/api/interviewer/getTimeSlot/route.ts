import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const {userid} = await req.json()
    const timeSlots = await db.timeSlot.findMany({
      where:{
              id:userid,
              status:"available"
      },

    });
    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error("Error fetching timeslot:", error);
    return NextResponse.json({ error: "Failed to fetch timeslot" }, { status: 500 });
  }
}
