"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { gender } from "@prisma/client";

interface SkillData {
  Name: string;
  email: string;
  gender?: string;
  description?: string;
  dob?: string;
  profileImage?: string;
  role?: string;
  linkedin?: string;
  github?: string;
  resume?: string;
}

export const addPersonalProfile = async (data: SkillData) => {

  console.log("Received Data:", data);

  // 1️⃣ Ensure `data` is not null
  if (!data) {
    return { error: "Invalid input: Data is null" };
  }
  if ( typeof data !== "object") {
    console.error("Invalid input: Data is null or not an object");
    return { error: "Invalid input: Data is null or not an object" };
  }
  const user = await currentUser();
  console.log("user:",user?.id);
  if (!user || !user.id) {
    return { error: "Unauthorized or User ID missing" };
  }

  // 2️⃣ Ensure `gender` is valid
  const validGenders: gender[] = ["male", "female"];
  const formattedGender = validGenders.includes(data.gender as gender)
    ? (data.gender as gender)
    : "male"; // Default fallback

  try {
    const profile = await db.user.update({
      where:{
        id:user.id
      },
      data: {
       // Ensure `user.id` is not null
        name: data.Name,
        email: data.email,
        Gender: formattedGender, // Ensure correct enum value
        dob: data.dob ?? null, // Handle optional fields properly
        description: data.description ?? null,
        ProfileImage: user.imageUrl?? null,
        resume:data.resume?? null,
        Type: data.role, // Ensure correct casing
        Linkedin: data.linkedin ?? null,
        Github: data.github ?? null,
      },
    });

    return { success: true, profile };
  } catch (error) {
    console.error("Error saving profile:", error);
    return { error: "Failed to save profile" };
  }
};

export const getPersonalProfiles=async(userId:any)=>{
  try {
  const getProfile=await db.user.findUnique(
      {
        where:{
          id:userId
        }
      }
    )
    return { success: true,getProfile };


  }catch(error){
    console.error("Error fetching projects:", error);
    return { error: "Something went wrong! Please try again." };
  }
}
