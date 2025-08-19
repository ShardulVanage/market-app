"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Grid3X3, MapPin, Phone, Mail, Globe } from "lucide-react"
import { usePocketBaseFetchWithLoading } from "@/hooks/use-pocketbase-fetch"
import { getClientPb } from "@/lib/pocketbase"

export default function CompanyDetailPage() {
  const [company, setCompany] = useState(null)
  const [products, setProducts] = useState([])
  const params = useParams()
  const router = useRouter()

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
    if (!filename) return "/generic-company-logo.png"
    const pb = getClientPb()
    return pb.files.getUrl(record, filename)
  }

  const getProductImageUrl = (record, filename) => {
    if (!filename || !record.images?.length) return "/modern-tech-product.png"
    const pb = getClientPb()
    return pb.files.getUrl(record, filename)
  }

  const handleProductClick = (productId) => {
    router.push(`/products/${productId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-full  flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center ">
          <h1 className="text-2xl font-bold mb-4">Company Not Found</h1>
          <button
            onClick={() => router.back()}
            className="bg-white text-[#3B4CCA] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen  py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white mb-8 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Companies
        </motion.button>

        {/* Company Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl p-8 shadow-lg mb-12"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={
                  getImageUrl(company, company.companyLogo) ||
                  "/placeholder.svg?height=128&width=128&query=company logo" ||
                  "/placeholder.svg" ||
                  "/placeholder.svg" ||
                  "/placeholder.svg"
                }
                alt={company.companyName}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-[#3B4CCA] mb-4">{company.companyName}</h1>

              {company.description && (
                <p className="text-gray-600 text-lg mb-6 leading-relaxed">{company.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                {company.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#3B4CCA]" />
                    <span>{company.address}</span>
                  </div>
                )}

                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#3B4CCA]" />
                    <span>{company.phone}</span>
                  </div>
                )}

                {company.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#3B4CCA]" />
                    <span>{company.email}</span>
                  </div>
                )}

                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#3B4CCA]" />
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#3B4CCA] transition-colors"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">Our Products</h2>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden group cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={
                        getProductImageUrl(product, product.images?.[0]) ||
                        "/placeholder.svg?height=300&width=300&query=product image" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <h4 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{product.title}</h4>

                    {product.price && (
                      <p className="text-lg font-semibold text-gray-800 mb-4">Rs. {product.price.toLocaleString()}</p>
                    )}

                    <button className="w-full bg-[#1E40AF] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2">
                      <Grid3X3 className="w-4 h-4" />
                      Get Best Price
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-white/60 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <p className="text-white/80 text-lg">No products available for this company</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
