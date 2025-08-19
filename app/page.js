
import Category from "@/components/Category";
import Hero from "@/components/Hero";
import ProductbyCompany from "@/components/product-by-company";
import ProductsSection from "@/components/ProductsSection";
import RegisteredCompanies from "@/components/RegisteredCompanies";



import Image from "next/image";

export default function Home() {
  return (
 <main>
  <Hero/>
  <Category/>
  <ProductbyCompany/>
  <ProductsSection/>
  <RegisteredCompanies/>
 </main>
  );
}
