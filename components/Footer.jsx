"use client"

import Link from "next/link"
import { ShoppingBag, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-[#29688A] to-[#1e4a61] relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 left-10 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
      <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-full blur-md"></div>
      
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg border border-white/10">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Marketplace</span>
            </Link>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm">
              Your trusted B2B marketplace connecting businesses worldwide. Discover opportunities, 
              build partnerships, and grow your business with us.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-[#76cfff] font-semibold text-lg">Quick Links</h3>
            <nav className="space-y-3">
              <Link
                href="/about"
                className="block text-gray-50 hover:text-white transition-colors text-sm"
              >
                About Us
              </Link>
              <Link
                href="/products"
                className="block text-gray-50 hover:text-white transition-colors text-sm"
              >
                Products
              </Link>
              <Link
                href="/companies"
                className="block text-gray-50 hover:text-white transition-colors text-sm"
              >
                Companies
              </Link>
              <Link
                href="/category"
                className="block text-gray-50 hover:text-white transition-colors text-sm"
              >
                Product Categories
              </Link>
            </nav>
          </div>

          {/* B2B Services */}
          <div className="space-y-4">
            <h3 className="text-[#76cfff] font-semibold text-lg">B2B Services</h3>
            <nav className="space-y-3">
              <Link
                href="/dashboard/requirements/add"
                className="block text-gray-50 hover:text-white transition-colors text-sm"
              >
                Post Requirements
              </Link>
              <Link
                href="/browse-requirements"
                className="block text-gray-50 hover:text-white transition-colors text-sm"
              >
                Browse Requirements
              </Link>
              <Link
                href="/register"
                className="block text-gray-50 hover:text-white transition-colors text-sm"
              >
                Become a Supplier
              </Link>
              <Link
                href="/dashboard"
                className="block text-gray-50 hover:text-white transition-colors text-sm"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-[#76cfff] font-semibold text-lg">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-[#bbe7ff] mt-1 flex-shrink-0" />
                <span className="text-gray-50 text-sm">
                  123 Business Street<br />
                  Commerce City, BC 12345
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-[#bbe7ff] flex-shrink-0" />
                <a
                  href="tel:+1234567890"
                  className="text-gray-50 hover:text-white transition-colors text-sm"
                >
                  +1 (234) 567-890
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-[#bbe7ff] flex-shrink-0" />
                <a
                  href="mailto:contact@marketplace.com"
                  className="text-gray-50 hover:text-white transition-colors text-sm"
                >
                  contact@marketplace.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-900 text-sm text-center sm:text-left">
              © {currentYear} Marketplace. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <Link
                href="/privacy"
                className="text-gray-900 hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-900 hover:text-white transition-colors text-sm"
              >
                Terms of Service
              </Link>
              <Link
                href="/support"
                className="text-gray-900 hover:text-white transition-colors text-sm"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}