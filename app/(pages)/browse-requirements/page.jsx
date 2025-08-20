"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Calendar, DollarSign, MessageSquare } from "lucide-react"
import { usePocketBaseFetchWithLoading } from "@/hooks/use-pocketbase-fetch"
import { getClientPb } from "@/lib/pocketbase"
import { InquiryDialog } from "@/components/inquiry-dialog"

export default function BrowseRequirementsPage() {
  const pb = getClientPb()
  const [requirements, setRequirements] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [budgetFilter, setBudgetFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  // Fetch requirements with auto-cancellation
  const fetchRequirements = useCallback(
    async (signal) => {
      try {
        let filter = 'approvalStatus = "approved"'

        if (searchTerm) {
          // Using quoteFor and requirementDetails fields that exist in your schema
          filter += ` && (quoteFor ~ "${searchTerm}" || requirementDetails ~ "${searchTerm}")`
        }

        if (categoryFilter !== "all") {
          filter += ` && category = "${categoryFilter}"`
        }

        // Note: Budget filtering removed since there's no budget field in your schema
        // You may need to add a budget field to your PocketBase collection
        if (budgetFilter !== "all") {
          console.warn("Budget filtering not available - budget field not found in schema")
        }

        let sort = "-created"
        if (sortBy === "oldest") sort = "+created"
        // Budget sorting removed since budget field doesn't exist
        if (sortBy === "budget-low" || sortBy === "budget-high") {
          console.warn("Budget sorting not available - budget field not found in schema")
          sort = "-created"
        }

        const records = await pb.collection("requirements").getList(1, 50, {
          filter,
          sort,
          expand: "user", // Changed from "buyer" to "user" as per your schema
          signal,
        })

        setRequirements(records.items)
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching requirements:", error)
        }
      }
    },
    [searchTerm, categoryFilter, budgetFilter, sortBy],
  )

  const isLoading = usePocketBaseFetchWithLoading(fetchRequirements, [searchTerm, categoryFilter, budgetFilter, sortBy])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatBudget = (budget) => {
    if (!budget) return "Budget not specified"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(budget)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background texture */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%2329688A' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Browse Requirements</h1>
                <p className="text-gray-600 mt-2">
                  Discover opportunities and connect with buyers looking for your services
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search requirements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40 border-gray-200">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Budget filter temporarily disabled - add budget field to your schema first */}
                  {/*
                  <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                    <SelectTrigger className="w-32 border-gray-200">
                      <SelectValue placeholder="Budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Budget</SelectItem>
                      <SelectItem value="0-100">$0 - $100</SelectItem>
                      <SelectItem value="100-500">$100 - $500</SelectItem>
                      <SelectItem value="500-1000">$500 - $1K</SelectItem>
                      <SelectItem value="1000+">$1K+</SelectItem>
                    </SelectContent>
                  </Select>
                  */}

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32 border-gray-200">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      {/* Budget sorting disabled until budget field is added */}
                      {/*
                      <SelectItem value="budget-high">Budget: High</SelectItem>
                      <SelectItem value="budget-low">Budget: Low</SelectItem>
                      */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#29688A]"></div>
              <span className="ml-3 text-gray-600">Loading requirements...</span>
            </div>
          ) : requirements.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {requirements.map((requirement) => (
               <Card
                  key={requirement.id}
                  className="border border-gray-200 hover:border-[#29688A] transition-colors duration-200 hover:shadow-lg"
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2">
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {requirement.quoteFor || "Requirement"}
                      </CardTitle>
                      {requirement.category && (
                        <p variant="secondary" className="self-start bg-[#29688A]/10 text-[#29688A] border-[#29688A]/20 rounded-r-3xl p-2 text-xs">
                          {requirement.category}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {requirement.requirementDetails || "No details provided"}
                    </p>

                    <div className="space-y-2">
                      {/* Budget display removed since field doesn't exist in schema */}
                      {/*
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="h-4 w-4 mr-2 text-[#29688A]" />
                        <span className="font-medium text-[#29688A]">{formatBudget(requirement.budget)}</span>
                      </div>
                      */}

                      {requirement.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{requirement.location}</span>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Posted {formatDate(requirement.created)}</span>
                      </div>

                      {requirement.expand?.user && (
                        <div className="text-sm text-gray-500">
                          <span>By: {requirement.expand.user.name || requirement.expand.user.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <InquiryDialog
                        requirement={{
                          id: requirement.id,
                          quoteFor: requirement.quoteFor || "Requirement",
                          requirementDetails: requirement.requirementDetails,
                        }}
                        seller={requirement.expand?.user}
                        trigger={
                          <Button className="w-full bg-[#29688A] hover:bg-[#29688A]/90 text-white" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Proposal
                          </Button>
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}