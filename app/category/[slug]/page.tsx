"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategoryData } from "@/lib/category-data"

export default function CategoryPage() {
  const params = useParams()
  const slug = params ? (params['slug'] as string) : ''
  const categoryData = getCategoryData(slug)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  if (!params) {
    return (
      <div className="container py-10" role="main" aria-label="category-error-section">
        <Card aria-label="category-error-card">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Unable to load category information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!categoryData) {
    return (
      <div className="container py-10" role="main" aria-label="category-not-found-section">
        <div className="mb-6">
          <Link href="/categories">
            <Button variant="outline" size="sm" aria-label="Back to Categories">
              <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Categories
            </Button>
          </Link>
        </div>
        <Card aria-label="category-not-found-card">
          <CardHeader>
            <CardTitle>Category Not Found</CardTitle>
            <CardDescription>
              We couldn&apos;t find the category you&apos;re looking for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The category &quot;{slug}&quot; does not exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10" role="main" aria-label="category-content-section">
      <div className="mb-6">
        <Link href="/categories">
          <Button variant="outline" size="sm" aria-label="Back to Categories">
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Categories
          </Button>
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{categoryData.name}</h1>
        <p className="text-muted-foreground mt-2">{categoryData.description}</p>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="category-items-loading-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden" aria-label={`loading-card-${i}`}>
              <div className="h-48 bg-muted animate-pulse" aria-hidden="true" />
              <CardHeader>
                <div className="h-6 w-2/3 bg-muted animate-pulse rounded" aria-hidden="true" />
                <div className="h-4 w-full bg-muted animate-pulse rounded mt-2" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted animate-pulse rounded" aria-hidden="true" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded mt-2" aria-hidden="true" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="category-items-grid">
          {categoryData.items.map((item) => (
            <Card key={item.id} className="overflow-hidden" aria-label={`${item.name}-card`}>
              <div 
                className="h-48 bg-cover bg-center" 
                style={{ backgroundImage: `url(${item.image})` }}
                aria-label={`${item.name}-image`}
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

