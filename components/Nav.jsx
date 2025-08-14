"use client"

import { useState } from "react"
import Link from "next/link"

import { Input } from "@/components/ui/input"
import { Search, ShoppingBag, Star } from "lucide-react"


export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")


  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <div>
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">Marketplace</span>
            </Link>

            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            <nav className="flex items-center space-x-4">
              <Link href="/login" className="text-foreground hover:text-primary">
           Login
              </Link>
              <Link href="/register" className="text-foreground hover:text-primary">
                Registration
              </Link>
            </nav>
          </div>
        </div>
      </header>




  
    </div>
  )
}
