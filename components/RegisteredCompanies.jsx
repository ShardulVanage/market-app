"use client"

import { useState } from "react"
import { getClientPb } from "@/lib/pocketbase"
import { usePocketBaseFetchWithLoading } from "@/hooks/use-pocketbase-fetch"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import Link from "next/link"
import Image from "next/image"

export default function RegisteredCompanies() {
  const [companies, setCompanies] = useState([])

  const loading = usePocketBaseFetchWithLoading(
    async (signal) => {
      const pb = getClientPb()
      const records = await pb.collection("companies").getList(1, 8, {
        filter: 'approvalStatus = "approved"',
        sort: "-created",
        signal,
      })
      setCompanies(records.items)
    },
    [], // No dependencies, fetch once on mount
    100, // 100ms debounce delay
  )

  const getLogoUrl = (company) => {
    if (company.companyLogo) {
      const pb = getClientPb()
      return pb.files.getUrl(company, company.companyLogo)
    }
    return "/placeholder.svg?height=80&width=80"
  }

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Registered Companies</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Discover our trusted network of registered companies</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-6 text-center animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Registered Companies</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Discover our trusted network of registered companies</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {companies.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
                <div className="w-32 h-32 mx-auto mb-4 relative overflow-hidden rounded-lg bg-gray-50">
                  <Image
                    src={getLogoUrl(company) || "/placeholder.svg"}
                    alt={`${company.companyName} logo`}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{company.companyName}</h3>
                <p className="text-xs text-gray-500">
                  {company.city && company.state ? `${company.city}, ${company.state}` : "Location not specified"}
                </p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/companies">
            <Button
              className="px-8 py-3 text-white font-medium rounded-lg transition-colors duration-300"
              style={{ backgroundColor: "#29688A" }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#1e4f6b")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#29688A")}
            >
              View More Companies
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
