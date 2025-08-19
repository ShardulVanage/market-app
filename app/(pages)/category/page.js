import Link from "next/link"
import { productCategories } from "@/lib/constants"

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#29688A]">
              Home
            </Link>
            <span>›</span>
            <span className="text-gray-900">Categories</span>
          </nav>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          {productCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                {/* Category Image */}
                <div className="lg:w-80 h-64 lg:h-auto flex-shrink-0">
                  <img
                    src={category.img || "/placeholder.svg"}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Category Content */}
                <div className="flex-1 p-6 lg:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.name}</h2>

                  {/* Subcategories Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {category.subcategories.map((subcategory, subIndex) => (
                      <div key={subIndex} className="space-y-3">
                        <h3 className="font-semibold text-gray-800 text-sm">{subcategory.name}</h3>
                        <ul className="space-y-2">
                          {subcategory.sub_subcategories.map((item, itemIndex) => (
                            <li key={itemIndex}>
                              <Link
                                href={`/category/${encodeURIComponent(category.name)}`}
                                className="text-[#29688A] hover:text-[#1e4f6b] text-sm transition-colors duration-200"
                              >
                                {item}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
