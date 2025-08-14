import { productCategories } from "./constants"

// Get subcategories for a given category
export function getSubcategories(categoryName) {
  const category = productCategories.find((cat) => cat.name === categoryName)
  if (!category) return []

  return category.subcategories.map((sub) => sub.name)
}

// Get sub-subcategories for a given category and subcategory
export function getSubSubcategories(categoryName, subcategoryName) {
  const category = productCategories.find((cat) => cat.name === categoryName)
  if (!category) return []

  const subcategory = category.subcategories.find((sub) => sub.name === subcategoryName)
  if (!subcategory) return []

  return subcategory.sub_subcategories || []
}

// Get category image URL
export function getCategoryImage(categoryName) {
  const category = productCategories.find((cat) => cat.name === categoryName)
  return category?.img || "/placeholder.svg?height=200&width=300"
}

// Get all category names
export function getAllCategories(){
  return productCategories.map((cat) => cat.name)
}
