"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

interface SkillData {
  languages: string[];
  frameworks: string[];
  tools: string[];
}

export const addSkills = async (data: SkillData) => {
  const user = await currentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const skills = await db.user.update({
        where:{
            id:user.id
        },
      data: {
      
       
        languages: { set: data.languages }, 
        frameworks: { set: data.frameworks },
        tools: { set: data.tools },
      },
    });

    return { success: true, skills };
  } catch (error) {
    console.error("Error saving skills:", error);
    return { error: "Failed to save skills" };
  }
};

export const getSkill=async(userId:any)=>{
  try {
   
    const getSkill=await db.user.findFirst(
      {
        where:{
          id:userId
        }
      }
    )
    return { success: true,getSkill };


  }catch(error){
    console.error("Error fetching projects:", error);
    return { error: "Something went wrong! Please try again." };
  }
}