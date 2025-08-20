"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const images = [
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1542744095-291d1f67b221?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)

      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
        setTimeout(() => setIsTransitioning(false), 200)
      }, 300)
    }, 3000)

    return () => clearInterval(interval)
  }, [images.length])

  const handleImageSelect = (index) => {
    if (index !== currentImageIndex) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentImageIndex(index)
        setTimeout(() => setIsTransitioning(false), 200)
      }, 300)
    }
  }

  return (
    <div className="bg-white drop-shadow-lg">
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="relative z-10 lg:w-full lg:max-w-2xl">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-y-0 right-8 hidden h-full w-80 translate-x-1/2 transform fill-white lg:block"
            >
              <polygon points="0,0 90,0 50,100 0,100" />
            </svg>
            <div className="relative px-6 py-20 sm:py-32 lg:px-8 lg:py-40 lg:pr-0">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="hidden sm:mb-8 sm:flex"
                >
                  <div className="relative rounded-full px-4 py-2 text-sm leading-6 text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors duration-300">
                    Connect with verified SMEs across India{" "}
                    <a href="/register" className="whitespace-nowrap font-semibold" style={{ color: "#29688A" }}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      Join now <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-5xl xl:text-6xl"
                >
                  <span className="block">India's Premier</span>
                  <span className="block" style={{ color: "#29688A" }}>
                    SME Marketplace
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="mt-6 text-lg leading-8 text-gray-600 max-w-lg"
                >
                  Discover thousands of verified small and medium enterprises. Connect, collaborate, and grow your business network with trusted partners across industries.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="mt-10 flex items-center gap-x-6"
                >
                  <motion.a
                    href="/products"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ backgroundColor: "#29688A" }}
                  >
                    Start Exploring
                  </motion.a>
                  <motion.a
                    href="register"
                    whileHover={{ x: 5 }}
                    className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700 transition-colors duration-300"
                  >
                    List Your Business <span aria-hidden="true">→</span>
                  </motion.a>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="mt-12 flex items-center gap-x-8 text-sm text-gray-500"
                >
                  <div className="flex items-center gap-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#29688A" }}></div>
                    <span>10,000+ SMEs</span>
                  </div>
                  <div className="flex items-center gap-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#29688A" }}></div>
                    <span>Verified Businesses</span>
                  </div>
                  <div className="flex items-center gap-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#29688A" }}></div>
                    <span>Pan-India Network</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="relative h-full w-full overflow-hidden bg-black">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                alt="Small and medium enterprises marketplace"
                src={images[currentImageIndex]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.6) 100%)`,
              }}
            />

            <AnimatePresence>
              {isTransitioning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  style={{
                    background: `radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.9) 100%)`,
                  }}
                />
              )}
            </AnimatePresence>

            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? "w-8" : "opacity-50 hover:opacity-75"
                  }`}
                  style={{ backgroundColor: "#29688A" }}
                />
              ))}
            </div>

            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/10"></div>
          </div>
        </div>
      </div>
    </div>
  )
}