'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

function Header() {
  const path=usePathname();
  useEffect(()=>{
    console.log(path);


  },[])
  return (
    <>
     <div>




    <header className="bg-[#1a4562] text-white py-4 shadow-md">
        <div className="container mx-auto text-center text-xl font-semibold">
          Mock Interview.io Portal
        </div>
      </header>
     </div>


    </>
  )
}

export default Header
