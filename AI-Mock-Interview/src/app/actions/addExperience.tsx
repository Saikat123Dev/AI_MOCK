"use server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import * as z from "zod";

const ExperienceSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role is required"),
  duration: z.string().min(1, "Duration is required"),
  description: z.string().optional(),
});

// Schema for the entire form
const SettingsSchema = z.object({
  experiences: z.array(ExperienceSchema),
});

export const addExperiences = async (
  values: z.infer<typeof SettingsSchema>
) => {
  try {
    // Validate input data against the schema
    const validatedData = SettingsSchema.parse(values);

    // Get the current user
    const user = await currentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    console.log(user);

    const experiences = await db.$transaction(
      validatedData.experiences.map((experience) =>
        db.experience.upsert({
          where: {
            userId:user.id
          },
          update: {
            Role: experience.role,
            Duration: experience.duration,
            Description: experience.description || "",
          },
          create: {
            userId: user.id,
            CompanyName: experience.company,
            Role: experience.role,
            Duration: experience.duration,
            Description: experience.description || "",
          },
        })
      )
    );

    console.log("Experiences uploaded successfully");
    return { success: "Experiences updated successfully" };
  } catch (error) {
    console.error("Error updating experiences:", error);
    if (error instanceof z.ZodError) {
      return { error: "Invalid form data. Please check your input." };
    }
    return { error: "Something went wrong! Please try again." };
  }
};

export const getExperiences = async (userId: any) => {
  try {
    const getExperiences = await db.experience.findMany({
      where: {
        userId: userId,
      },
    });
    return { success: true, getExperiences };
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return { error: "Something went wrong! Please try again." };
  }
};
