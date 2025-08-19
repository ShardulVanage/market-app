"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Grid3X3, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { getClientPb } from "../lib/pocketbase"
import { usePocketBaseFetchWithLoading } from "@/hooks/use-pocketbase-fetch"

export default function ProductSection() {
  const [companies, setCompanies] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0)
  const router = useRouter()

  const isLoadingCompanies = usePocketBaseFetchWithLoading(
    async (signal) => {
      const pb = getClientPb()
      const records = await pb.collection("companies").getList(1, 4, {
        filter: 'approvalStatus = "approved"',
        sort: "@random",
        requestKey: null,
        signal,
      })
      setCompanies(records.items)
    },
    [],
    200,
  )

  const isLoadingProducts = usePocketBaseFetchWithLoading(
    async (signal) => {
      if (companies.length > 0 && companies[selectedCompanyIndex]?.id) {
        const pb = getClientPb()
        const records = await pb.collection("products").getList(1, 3, {
          filter: `company = "${companies[selectedCompanyIndex].id}" && approvalStatus = "approved"`,
          sort: "-created",
          requestKey: null,
          signal,
        })
        setProducts(records.items)
      }
    },
    [selectedCompanyIndex, companies],
    150,
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

  const nextCompany = () => {
    setSelectedCompanyIndex((prev) => (prev + 1) % companies.length)
  }

  const prevCompany = () => {
    setSelectedCompanyIndex((prev) => (prev - 1 + companies.length) % companies.length)
  }

  const handleProductClick = (productId) => {
    router.push(`/product/${productId}`)
  }

  const handleViewMoreClick = (companyId) => {
    router.push(`/companies/${companyId}`)
  }

  if (isLoadingCompanies) {
    return (
      <div className="min-h-screen bg-[#29688A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <section className="min-h-full bg-[#29688A] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-12"
        >
          <div className="bg-white p-3 rounded-lg">
            <Grid3X3 className="w-8 h-8 text-[#29688A]" />
          </div>
          <h2 className="text-4xl font-bold text-white">Featured Brands and Products</h2>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Side - Company Card with Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 relative "
          >
            <button
              onClick={prevCompany}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-[#183b4e] hover:bg-black rounded-full shadow-lg flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <button
              onClick={nextCompany}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-[#183b4e] hover:bg-black rounded-full shadow-lg flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            <AnimatePresence mode="wait">
              {companies[selectedCompanyIndex] && (
                <motion.div
                  key={selectedCompanyIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-2xl p-8 text-center shadow-xl w-full h-full flex flex-col justify-center"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={
                        getImageUrl(companies[selectedCompanyIndex], companies[selectedCompanyIndex].companyLogo) ||
                        "/placeholder.svg?height=96&width=96&query=company logo" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt={companies[selectedCompanyIndex].companyName}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <h3 className="text-2xl font-bold text-[#29688A] mb-3">
                    {companies[selectedCompanyIndex].companyName}
                  </h3>

                  <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                    {companies[selectedCompanyIndex].description || "Simplifying Technology"}
                  </p>

                  <div className="text-sm font-semibold text-gray-800 mb-6">
                    {companies[selectedCompanyIndex].companyName.toUpperCase()}
                  </div>

                  <button
                    onClick={() => handleViewMoreClick(companies[selectedCompanyIndex].id)}
                    className="w-full bg-[#29688A] hover:bg-[#1e5a7a] text-white py-3 px-4 rounded-lg font-semibold transition-colors mb-6"
                  >
                    View More
                  </button>

                  {/* Company Navigation Dots */}
                  <div className="flex justify-center gap-2">
                    {companies.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedCompanyIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === selectedCompanyIndex ? "bg-[#29688A]" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Side - Product Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-3"
          >
            {isLoadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCompanyIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
                >
                  {products.length > 0 ? (
                    products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="bg-white rounded-2xl shadow-lg hover:shadow-xl overflow-hidden group relative cursor-pointer h-full flex flex-col transition-shadow duration-300"
                        onClick={() => handleProductClick(product.id)}
                      >
                        {/* Product Image */}
                        <div className="aspect-square bg-gray-50 overflow-hidden flex-shrink-0">
                          <img
                            src={
                              getProductImageUrl(product, product.images?.[0]) ||
                              "/placeholder.svg?height=300&width=300&query=product image" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg"
                            }
                            alt={product.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 leading-tight">
                              {product.title}
                            </h4>

                            <div className="mb-4 min-h-[28px] flex items-center">
                              {product.price ? (
                                <p className="text-xl font-bold text-[#29688A]">₹{product.price.toLocaleString()}</p>
                              ) : (
                                <p className="text-lg font-semibold text-gray-500">Price on Request</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <button className="w-full bg-[#29688A]  text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ">
                              <Grid3X3 className="w-4 h-4" />
                              Get more details
                            </button>

                            <p className="text-sm text-gray-500 text-center font-medium">
                              By {companies[selectedCompanyIndex]?.companyName?.toUpperCase() || "COMPANY"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
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
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
