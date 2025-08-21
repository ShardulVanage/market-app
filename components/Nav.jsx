"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ShoppingBag, ChevronDown, User, LogIn, Menu, X, LayoutDashboard, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import Image from "next/image"

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { currentUser, logout, isLoading } = useAuth()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
    }
  }

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName)
  }

  const closeDropdown = () => {
    setActiveDropdown(null)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    setActiveDropdown(null)
  }

  const handleLogout = () => {
    logout()
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="bg-white shadow-sm border-b">
      {/* Top Navbar - Logo and Auth */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
             <Image src={'/logo.png'} width={200} height={200} alt="logo"/>
            </Link>

            <div className="flex items-center space-x-2 md:space-x-3">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-gray-600 hover:text-[#cde6f3] p-2"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              <div className="hidden md:flex items-center space-x-3">
                {currentUser ? (
                  // Logged in state
                  <>
                    <Button
                      variant="ghost"
                      className="text-gray-600 hover:text-[#cde6f3] hover:bg-[#29688A]/5 font-medium"
                      asChild
                    >
                      <Link href="/dashboard" className="flex items-center space-x-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </Button>
                    <Button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 lg:px-6"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Logout</span>
                    </Button>
                  </>
                ) : (
                  // Not logged in state
                  <>
                    <Button
                      variant="ghost"
                      className="text-gray-600 hover:text-[#cde6f3] hover:bg-[#29688A]/5 font-medium"
                      asChild
                    >
                      <Link href="/login" className="flex items-center space-x-2">
                        <LogIn className="h-4 w-4" />
                        <span>Login</span>
                      </Link>
                    </Button>
                    <Button className="bg-[#29688A] hover:bg-[#29688A]/90 text-white font-medium px-4 lg:px-6" asChild>
                      <Link href="/register" className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Register</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navbar - Navigation and Search - Desktop Only */}
      <div className="hidden md:block bg-[#29688A]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 lg:gap-8">
            {/* Navigation Menu */}
            <nav className="flex items-center space-x-4 lg:space-x-8">
              <Link
                href="/"
                className="text-white hover:text-[#cde6f3] font-medium transition-colors py-2 text-sm lg:text-base"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-white hover:text-[#cde6f3] font-medium transition-colors py-2 text-sm lg:text-base"
              >
                About
              </Link>

              {/* B2B Opportunities Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("b2b")}
                  className="flex items-center space-x-1 text-white hover:text-[#cde6f3] font-medium transition-colors py-2 text-sm lg:text-base"
                >
                  <span className="whitespace-nowrap">B2B Opportunities</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${activeDropdown === "b2b" ? "rotate-180" : ""}`}
                  />
                </button>

                {activeDropdown === "b2b" && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={closeDropdown} />
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <Link
                        href="/dashboard/requirements/add"
                        className="block px-4 py-3 text-black   transition-colors"
                        onClick={closeDropdown}
                      >
                        Post Requirements
                      </Link>
                      <Link
                        href="/browse-requirements"
                        className="block px-4 py-3 text-black  transition-colors"
                        onClick={closeDropdown}
                      >
                        Browse Requirements
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <Link
                href="/products"
                className="text-white hover:text-[#cde6f3] font-medium transition-colors py-2 text-sm lg:text-base"
              >
                Products
              </Link>

              <Link
                href="/companies"
                className="text-white hover:text-[#cde6f3] font-medium transition-colors py-2 text-sm lg:text-base"
              >
                Companies
              </Link>

              {/* <Link
                href="/user-manual"
                className="text-white hover:text-[#cde6f3] font-medium transition-colors py-2 text-sm lg:text-base whitespace-nowrap"
              >
                User Manual
              </Link> */}

              <Link
                href="/category"
                className="text-white hover:text-[#cde6f3] font-medium transition-colors py-2 text-sm lg:text-base whitespace-nowrap"
              >
                Product Category
              </Link>
            </nav>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-sm lg:max-w-md">
              <div className="relative drop-shadow-sm ">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products, companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-16 py-6 border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20 bg-white text-sm "
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#29688A] hover:bg-[#29688A]/90 text-white px-3 text-xs rounded-4xl"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleMobileMenu} />

          {/* Mobile Menu */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300">
            <div className="p-4">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-semibold text-[#29688A]">Menu</span>
                <Button variant="ghost" size="sm" onClick={toggleMobileMenu} className="p-2">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search products, companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-3 border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20 bg-white"
                  />
                </div>
                <Button type="submit" className="w-full mt-2 bg-[#29688A] hover:bg-[#29688A]/90 text-white">
                  Search
                </Button>
              </form>

              {/* Mobile Navigation */}
              <nav className="space-y-1 mb-6">
                <Link
                  href="/about"
                  className="block px-4 py-3 text-black hover:bg-[#29688A]/5 hover:text-[#cde6f3] rounded-lg transition-colors"
                  onClick={toggleMobileMenu}
                >
                  About
                </Link>

                {/* Mobile B2B Dropdown */}
                <div>
                  <button
                    onClick={() => toggleDropdown("b2b-mobile")}
                    className="flex items-center justify-between w-full px-4 py-3 text-black hover:bg-[#29688A]/5 hover:text-[#cde6f3] rounded-lg transition-colors"
                  >
                    <span>B2B Opportunities</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${activeDropdown === "b2b-mobile" ? "rotate-180" : ""}`}
                    />
                  </button>

                  {activeDropdown === "b2b-mobile" && (
                    <div className="ml-4 mt-1 space-y-1">
                      <Link
                        href="/b2b/post-requirements"
                        className="block px-4 py-2 text-gray-600 hover:bg-[#29688A]/5 hover:text-[#cde6f3] rounded-lg transition-colors"
                        onClick={toggleMobileMenu}
                      >
                        Post Requirements
                      </Link>
                      <Link
                        href="/browse-requirements"
                        className="block px-4 py-2 text-gray-600 hover:bg-[#29688A]/5 hover:text-[#cde6f3] rounded-lg transition-colors"
                        onClick={toggleMobileMenu}
                      >
                        Browse Requirements
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/products"
                  className="block px-4 py-3 text-black hover:bg-[#29688A]/5 hover:text-[#cde6f3] rounded-lg transition-colors"
                  onClick={toggleMobileMenu}
                >
                  Products
                </Link>

                <Link
                  href="/companies"
                  className="block px-4 py-3 text-black hover:bg-[#29688A]/5 hover:text-[#cde6f3] rounded-lg transition-colors"
                  onClick={toggleMobileMenu}
                >
                  Companies
                </Link>

                {/* <Link
                  href="/user-manual"
                  className="block px-4 py-3 text-black hover:bg-[#29688A]/5 hover:text-[#cde6f3] rounded-lg transition-colors"
                  onClick={toggleMobileMenu}
                >
                  User Manual
                </Link> */}

                <Link
                  href="/category"
                  className="block px-4 py-3 text-black hover:bg-[#29688A]/5 hover:text-[#cde6f3] rounded-lg transition-colors"
                  onClick={toggleMobileMenu}
                >
                  Product Category
                </Link>
              </nav>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                {currentUser ? (
                  // Logged in state
                  <>
                    <Button
                      variant="outline"
                      className="w-full border-[#29688A] text-[#29688A] hover:bg-[#29688A]/5 bg-transparent"
                      asChild
                    >
                      <Link
                        href="/dashboard"
                        className="flex items-center justify-center space-x-2"
                        onClick={toggleMobileMenu}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </Button>
                    <Button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Logout</span>
                    </Button>
                  </>
                ) : (
                  // Not logged in state
                  <>
                    <Button
                      variant="outline"
                      className="w-full border-[#29688A] text-[#29688A] hover:bg-[#29688A]/5 bg-transparent"
                      asChild
                    >
                      <Link
                        href="/login"
                        className="flex items-center justify-center space-x-2"
                        onClick={toggleMobileMenu}
                      >
                        <LogIn className="h-4 w-4" />
                        <span>Login</span>
                      </Link>
                    </Button>
                    <Button className="w-full bg-[#29688A] hover:bg-[#29688A]/90 text-white" asChild>
                      <Link
                        href="/register"
                        className="flex items-center justify-center space-x-2"
                        onClick={toggleMobileMenu}
                      >
                        <User className="h-4 w-4" />
                        <span>Register</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
