import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request:NextRequest){
    const user=await currentUser();
    console.log("user:",user);
    const userid=user?.id;
    try{
        const fetchAllInterviews=await db.mockInterview.findMany({
            where:{
                userId:userid

            }
        })
        return NextResponse.json(fetchAllInterviews);


    }catch(error:any){
        console.log("error in fetching all Interviews",error.message||error);
        return NextResponse.json(
            {message:"error fetching all interview questions"},
            {status:500}
        );

    }

}
