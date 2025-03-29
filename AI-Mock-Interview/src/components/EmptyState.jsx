import { Card, CardContent } from '@/components/ui/card'
import React from 'react'

export default function EmptyState({ icon, title, description, action }) {
  return (
    <Card className="w-full border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-xl mb-2">{title}</h3>
        <p className="text-gray-500 text-center mb-6 max-w-sm">
          {description}
        </p>
        {action}
      </CardContent>
    </Card>
  )
}
