"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"

import { productCategories } from "@/lib/constants"

export default function Category() {
  const scrollRef = useRef(null)

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: "smooth" })
    }
  }



  return (
    <div className="min-h-hull bg-background">
      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
         <h1
                 
                  className="text-3xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl xl:text-5xl"
                >
                  <span className="block">Explore
</span>
                  <span className="block" style={{ color: "#29688A" }}>
                  Product Categories
                  </span>
                </h1>
            <p className="text-muted-foreground">Find exactly what you're looking for</p>
          </div>

          <div className="relative">
            {/* Navigation Buttons */}
            <div className="absolute -top-16 right-0 flex gap-2 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollLeft}
                className="h-10 w-10 p-0 rounded-full border-2 hover:bg-[#29688A] hover:text-white hover:border-[#29688A] transition-all duration-300 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={scrollRight}
                className="h-10 w-10 p-0 rounded-full border-2 hover:bg-[#29688A] hover:text-white hover:border-[#29688A] transition-all duration-300 bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Carousel Container */}
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitScrollbar: { display: "none" },
              }}
            >
              {productCategories.map((category) => {
                const subcategoryNames = category.subcategories.map((sub) => sub.name)

                return (
                  <Link key={category.name} href={`/category/${encodeURIComponent(category.name)}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer flex-shrink-0 w-80 hover:-translate-y-1">
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img
                            src={category.img || "/placeholder.svg"}
                            alt={category.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(category.name.toLowerCase())}`
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/50 transition-all duration-300" />
                          <div className="absolute top-3 right-3 bg-[#29688A] text-white px-2 py-1 rounded-full text-xs font-medium">
                            {category.subcategories.length} items
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-[#29688A] transition-colors duration-300">
                            {category.name}
                          </h3>
                          {/* <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {subcategoryNames.slice(0, 3).join(" • ")}
                            {subcategoryNames.length > 3 && ` • +${subcategoryNames.length - 3} more`}
                          </p> */}
                          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-[#29688A] text-sm font-medium flex items-center">
                              Explore Category
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: Math.ceil(productCategories.length / 3) }).map((_, index) => (
                <div key={index} className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              ))}
            </div>
          </div>
        </div>
      </section>


    
    </div>
  )
}
