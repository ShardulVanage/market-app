"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Grid3X3,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  Calendar,
  Users,
  DollarSign,
  Award,
  Handshake,
  FileCheck,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { usePocketBaseFetchWithLoading } from "@/hooks/use-pocketbase-fetch"
import { getClientPb } from "@/lib/pocketbase"
import { Button } from "@/components/ui/button"

export default function CompanyDetailPage() {
  const [company, setCompany] = useState(null)
  const [products, setProducts] = useState([])
  const params = useParams()
  const router = useRouter()
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const shouldTruncateDescription = (description) => {
    if (!description) return false
    const lines = description.split("\n")
    return lines.length > 8 || description.length > 600
  }

  const getTruncatedDescription = (description) => {
    if (!description) return ""
    const lines = description.split("\n")
    if (lines.length > 8) {
      return lines.slice(0, 8).join("\n")
    }
    if (description.length > 600) {
      return description.substring(0, 600) + "..."
    }
    return description
  }
  const isLoading = usePocketBaseFetchWithLoading(
    async (signal) => {
      if (!params.companyId) return

      const pb = getClientPb()

      try {
        // Fetch company details
        const companyRecord = await pb.collection("companies").getOne(params.companyId, {
          signal,
        })
        setCompany(companyRecord)

        // Fetch company products
        const productsRecord = await pb.collection("products").getList(1, 50, {
          filter: `company = "${params.companyId}" && approvalStatus = "approved"`,
          sort: "-created",
          signal,
        })
        setProducts(productsRecord.items)
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching company data:", error)
        }
      }
    },
    [params.companyId],
  )

  const getImageUrl = (record, filename) => {
    if (!filename) return "/placeholder.svg?height=128&width=128"
    const pb = getClientPb()
    return pb.files.getUrl(record, filename)
  }

  const getProductImageUrl = (record, filename) => {
    if (!filename || !record.images?.length) return "/placeholder.svg?height=300&width=300"
    const pb = getClientPb()
    return pb.files.getUrl(record, filename)
  }

  const handleProductClick = (productId) => {
    router.push(`/product/${productId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#29688A]"></div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Company Not Found</h1>
          <button
            onClick={() => router.back()}
            className="bg-[#29688A] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e4f6b] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#29688A] mb-6 hover:text-[#1e4f6b] transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Companies
        </motion.button>

        {/* Company Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8"
        >
          <div className="flex flex-col  gap-8">
            {/* Company Logo & Basic Info */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="w-32 h-32 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200 mb-4">
                <img
                  src={getImageUrl(company, company.companyLogo) || "/placeholder.svg"}
                  alt={company.companyName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.companyName}</h1>
                {company.companyType && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#29688A]/10 text-[#29688A]">
                    <Building2 className="w-4 h-4 mr-1" />
                    {company.companyType}
                  </span>
                )}
              </div>
            </div>

            {/* Company Details */}
            <div className="flex-1">
              {/* {company.description && (
                <p className="text-gray-600 text-lg mb-6 leading-relaxed">{company.description}</p>
              )} */}


<div className="text-gray-600 leading-relaxed py-4">
                <p className="whitespace-pre-line">
                  {shouldTruncateDescription(company.description) && !isDescriptionExpanded
                    ? getTruncatedDescription(company.description)
                    : company.description}
                </p>
                {shouldTruncateDescription(company.description) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 p-0 h-auto text-[#29688A] hover:text-[#1e4f6b] hover:bg-transparent font-medium"
                  >
                    {isDescriptionExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Read Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Read More
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {company.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#29688A] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-900 font-medium">Address</p>
                      <p className="text-gray-600 text-sm">
                        {company.address}
                        {company.city && `, ${company.city}`}
                        {company.state && `, ${company.state}`}
                        {company.pincode && ` - ${company.pincode}`}
                        {company.country && `, ${company.country}`}
                      </p>
                    </div>
                  </div>
                )}

                {company.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[#29688A]" />
                    <div>
                      <p className="text-gray-900 font-medium">Phone</p>
                      <p className="text-gray-600 text-sm">{company.phone}</p>
                    </div>
                  </div>
                )}

                {company.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#29688A]" />
                    <div>
                      <p className="text-gray-900 font-medium">Email</p>
                      <p className="text-gray-600 text-sm">{company.email}</p>
                    </div>
                  </div>
                )}

                {company.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-[#29688A]" />
                    <div>
                      <p className="text-gray-900 font-medium">Website</p>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#29688A] hover:text-[#1e4f6b] transition-colors text-sm"
                      >
                        {company.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Company Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {company.foundedYear && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-[#29688A]" />
                    <div>
                      <p className="text-gray-900 font-medium">Founded</p>
                      <p className="text-gray-600 text-sm">{company.foundedYear}</p>
                    </div>
                  </div>
                )}

                {company.employeeCount && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-[#29688A]" />
                    <div>
                      <p className="text-gray-900 font-medium">Employees</p>
                      <p className="text-gray-600 text-sm">{company.employeeCount}</p>
                    </div>
                  </div>
                )}

                {company.annualTurnover && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-[#29688A]" />
                    <div>
                      <p className="text-gray-900 font-medium">Annual Turnover</p>
                      <p className="text-gray-600 text-sm">{company.annualTurnover}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Additional Information Sections */}
        <div className="space-y-6 mb-8">
          {/* Joint Ventures */}
          {company.jvDetails && company.jvDetails.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Handshake className="w-5 h-5 text-[#29688A]" />
                <h3 className="text-xl font-semibold text-gray-900">Joint Ventures</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Company Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Country</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Products</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Holding (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.jvDetails.map((jv, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-900 font-medium">{jv.name || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">{jv.country || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">{jv.products || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">{jv.type || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">{jv.holding ? `${jv.holding}%` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Collaborations */}
          {company.collaborationDetails && company.collaborationDetails.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-[#29688A]" />
                <h3 className="text-xl font-semibold text-gray-900">Collaborations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Partner Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Country</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.collaborationDetails.map((collab, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-900 font-medium">{collab.name || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">{collab.country || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">{collab.type || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Standards & Certifications */}
          {company.standardDetails && company.standardDetails.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-[#29688A]" />
                <h3 className="text-xl font-semibold text-gray-900">Standards & Certifications</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Standard</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Institute</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Remarks</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.standardDetails.map((standard, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-900 font-medium">{standard.standard || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">{standard.institute || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">{standard.remark || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {standard.date ? new Date(standard.date).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>

        {/* Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Grid3X3 className="w-6 h-6 text-[#29688A]" />
            <h2 className="text-2xl font-bold text-gray-900">Our Products</h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-md transition-all duration-300"
                  onClick={() => handleProductClick(product.id)}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    <img
                      src={getProductImageUrl(product, product.images?.[0]) || "/placeholder.svg"}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.title}</h4>

                    {product.price && (
                      <p className="text-lg font-bold text-[#29688A] mb-3">₹{product.price.toLocaleString()}</p>
                    )}

                    <button className="w-full bg-[#29688A] text-white py-2.5 px-4 rounded-lg font-medium hover:bg-[#1e4f6b] transition-colors flex items-center justify-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      Get Best Price
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-gray-400 mb-4">
                <Grid3X3 className="w-16 h-16 mx-auto" />
              </div>
              <p className="text-gray-600 text-lg">No products available for this company</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
