"use client"

import { useState, useEffect, useMemo } from "react"
import { getClientPb } from "@/lib/pocketbase"
import { usePocketBaseFetchWithLoading } from "@/hooks/use-pocketbase-fetch"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { Search, MapPin, Calendar, Users } from "lucide-react"

export default function CompaniesPage() {
  const [allCompanies, setAllCompanies] = useState([]) // Store all fetched companies
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const companiesPerPage = 20 // Increased from 12 to 20

  const loading = usePocketBaseFetchWithLoading(
    async (signal) => {
      const pb = getClientPb()

      // Only fetch if we're not in search mode or if we need more data
      if (!isSearching) {
        const records = await pb.collection("companies").getList(1, 100, {
          // Fetch more records initially
          filter: 'approvalStatus = "approved"',
          sort: "-created",
          signal,
        })
        setAllCompanies(records.items)
      }
    },
    [], // No dependencies - only fetch once on mount
    0, // No debounce for initial load
  )

  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) {
      return allCompanies
    }

    const localResults = allCompanies.filter(
      (company) =>
        company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return localResults
  }, [allCompanies, searchTerm])

  useEffect(() => {
    const searchAPI = async () => {
      if (!searchTerm.trim()) {
        setIsSearching(false)
        setSearchResults([])
        return
      }

      // If local search has good results, don't hit API
      if (filteredCompanies.length >= 5) {
        setIsSearching(false)
        setSearchResults([])
        return
      }

      // Only search API if local results are insufficient
      setIsSearching(true)

      try {
        const pb = getClientPb()
        const filter = `approvalStatus = "approved" && (companyName ~ "${searchTerm}" || city ~ "${searchTerm}" || state ~ "${searchTerm}" || description ~ "${searchTerm}")`

        const records = await pb.collection("companies").getList(1, 50, {
          filter,
          sort: "-created",
        })

        setSearchResults(records.items)
      } catch (error) {
        console.error("Search error:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(searchAPI, 500) // Debounce API search
    return () => clearTimeout(timeoutId)
  }, [searchTerm, filteredCompanies.length])

  const displayCompanies = useMemo(() => {
    if (!searchTerm.trim()) {
      return allCompanies
    }

    // Combine local results with API results, removing duplicates
    const combined = [...filteredCompanies]
    searchResults.forEach((apiResult) => {
      if (!combined.find((local) => local.id === apiResult.id)) {
        combined.push(apiResult)
      }
    })

    return combined
  }, [allCompanies, filteredCompanies, searchResults, searchTerm])

  const totalPages = Math.ceil(displayCompanies.length / companiesPerPage)
  const paginatedCompanies = displayCompanies.slice(
    (currentPage - 1) * companiesPerPage,
    currentPage * companiesPerPage,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const getLogoUrl = (company) => {
    if (company.companyLogo) {
      const pb = getClientPb()
      return pb.files.getUrl(company, company.companyLogo)
    }
    return "/placeholder.svg?height=120&width=120"
  }

  const handleSearch = (e) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">All Registered Companies</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse through our comprehensive directory of registered companies
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search companies, cities, or states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-[#29688A] focus:border-transparent"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#29688A]"></div>
                </div>
              )}
            </div>
          </form>

          {searchTerm && (
            <div className="text-center mt-4 text-sm text-gray-600">
              Found {displayCompanies.length} companies
              {filteredCompanies.length > 0 &&
                searchResults.length > 0 &&
                ` (${filteredCompanies.length} local, ${searchResults.length} from search)`}
            </div>
          )}
        </div>
      </div>

      {/* Companies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(20)].map(
              (
                _,
                i, // Updated skeleton count
              ) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </Card>
              ),
            )}
          </div>
        ) : paginatedCompanies.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600">Try adjusting your search terms</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedCompanies.map((company) => (
                <Link key={company.id} href={`/companies/${company.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer group h-full">
                    <div className="text-center mb-4">
                      <div className="w-24 h-24 mx-auto mb-4 relative overflow-hidden rounded-lg bg-gray-50">
                        <Image
                          src={getLogoUrl(company) || "/placeholder.svg"}
                          alt={`${company.companyName} logo`}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">{company.companyName}</h3>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      {(company.city || company.state) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#29688A]" />
                          <span>
                            {company.city && company.state
                              ? `${company.city}, ${company.state}`
                              : company.city || company.state}
                          </span>
                        </div>
                      )}

                      {company.foundedYear && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#29688A]" />
                          <span>Founded {company.foundedYear}</span>
                        </div>
                      )}

                      {company.employeeCount && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#29688A]" />
                          <span>{company.employeeCount} employees</span>
                        </div>
                      )}
                    </div>

                    {company.description && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2">{company.description}</p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2"
                >
                  Previous
                </Button>

                <div className="flex gap-1">
                  {(() => {
                    const maxVisible = 5
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
                    const endPage = Math.min(totalPages, startPage + maxVisible - 1)

                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1)
                    }

                    return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                      const pageNum = startPage + i
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                          className="px-3 py-2 min-w-[40px]"
                          style={currentPage === pageNum ? { backgroundColor: "#29688A" } : {}}
                        >
                          {pageNum}
                        </Button>
                      )
                    })
                  })()}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
