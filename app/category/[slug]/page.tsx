"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Activity, Award, Book, Brain, ChevronLeft, Coffee, Dumbbell, Moon, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoryProgressChart } from "@/components/category-progress-chart"
import { getCategoryData } from "@/lib/category-data"

export default function CategoryPage() {
  const params = useParams() as { slug: string }
  const slug = params.slug

  // Map slug to category data
  const categoryData = getCategoryData(slug as string)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (!categoryData) {
    return (
      <div className="container py-10">
        <div className="mb-6">
          <Link href="/categories">
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Category Not Found</CardTitle>
            <CardDescription>
              We couldn't find the category you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The category "{slug}" does not exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link href="/categories">
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{categoryData.name}</h1>
        <p className="text-muted-foreground mt-2">{categoryData.description}</p>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-muted animate-pulse" />
              <CardHeader>
                <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categoryData.items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div 
                className="h-48 bg-cover bg-center" 
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

