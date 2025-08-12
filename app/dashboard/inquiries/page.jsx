"use client"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import AuthGuard from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { getClientPb } from "@/lib/pocketbase"
import { MessageSquare, Package, FileText, Eye, ArrowLeft } from "lucide-react"
import { usePocketBaseFetch } from "@/hooks/use-pocketbase-fetch"

export default function InquiriesPage() {
  const { currentUser, isLoading } = useAuth()
  const router = useRouter()
  const pb = getClientPb()

  const [sentInquiries, setSentInquiries] = useState([])
  const [receivedInquiries, setReceivedInquiries] = useState([])
  const [isFetchingData, setIsFetchingData] = useState(true)

  const fetchInquiries = useCallback(
    async (signal) => {
      if (!currentUser?.id || !pb.authStore.isValid) {
        setIsFetchingData(false)
        return
      }

      setIsFetchingData(true)
      try {
        // Fetch sent inquiries
        const sent = await pb.collection("inquiries").getList(1, 50, {
          filter: `buyer="${currentUser.id}"`,
          sort: "-created",
          expand: "seller,product,requirement",
          signal,
        })
        setSentInquiries(sent.items)

        // Fetch received inquiries (only for sellers)
        if (currentUser.userRole === "seller") {
          const received = await pb.collection("inquiries").getList(1, 50, {
            filter: `seller="${currentUser.id}"`,
            sort: "-created",
            expand: "buyer,product,requirement",
            signal,
          })
          setReceivedInquiries(received.items)
        }
      } catch (err) {
        if (err.name === "AbortError" || err.message?.includes("autocancelled")) {
          return
        }
        console.error("Failed to fetch inquiries:", err)
      } finally {
        setIsFetchingData(false)
      }
    },
    [currentUser, pb],
  )

  usePocketBaseFetch(fetchInquiries, [currentUser?.id])

  const getStatusBadge = (status) => {
    const variant = status === "replied" ? "default" : status === "closed" ? "destructive" : "secondary"
    return (
      <Badge variant={variant} className="text-xs">
        {status}
      </Badge>
    )
  }

  const InquiryCard = ({ inquiry, type }) => {
    const isProduct = !!inquiry.product
    const targetUser = type === "sent" ? inquiry.expand?.seller : inquiry.expand?.buyer
    const targetItem = isProduct ? inquiry.expand?.product : inquiry.expand?.requirement

    return (
      <Card key={inquiry.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              {isProduct ? (
                <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              ) : (
                <FileText className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base">
                  {isProduct ? "Product Inquiry" : "Requirement Inquiry"}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {type === "sent" ? "To" : "From"}: {targetUser?.firstName} {targetUser?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-2 w-full sm:w-auto">
              {getStatusBadge(inquiry.status)}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/inquiries/${inquiry.id}`)}
                className="text-xs"
              >
                <Eye className="w-3 h-3 mr-1 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">View</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 text-sm truncate">
                {isProduct ? "Product" : "Requirement"}: {targetItem?.title || targetItem?.quoteFor}
              </h4>
              {targetItem?.category && (
                <p className="text-sm text-gray-600 truncate">Category: {targetItem.category}</p>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 text-sm">Message</h4>
              <p className="text-gray-600 text-sm line-clamp-2">{inquiry.message}</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-600 pt-2 border-t space-y-1 sm:space-y-0">
              <span className="text-xs sm:text-sm">Sent: {new Date(inquiry.created).toLocaleDateString()}</span>
              {inquiry.chat && inquiry.chat.length > 0 && (
                <span className="flex items-center text-xs sm:text-sm">
                  <MessageSquare className="w-3 h-3 mr-1 sm:w-4 sm:h-4" />
                  {inquiry.chat.length} messages
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Mobile-friendly header */}
          <div className="flex flex-col sm:flex-row sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <Button variant="outline" onClick={() => router.push("/dashboard")} size="sm" className="self-start">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div className="sm:ml-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inquiries</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your business inquiries and communications</p>
            </div>
          </div>

          <Tabs defaultValue="sent" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="sent" className="text-xs sm:text-sm">
                Sent Inquiries
              </TabsTrigger>
              <TabsTrigger
                value="received"
                disabled={currentUser?.userRole !== "seller"}
                className="text-xs sm:text-sm"
              >
                Received Inquiries
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sent" className="mt-6">
              {isFetchingData ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : sentInquiries.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 sm:py-12">
                    <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No inquiries sent yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  {sentInquiries.map((inquiry) => (
                    <InquiryCard key={inquiry.id} inquiry={inquiry} type="sent" />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="received" className="mt-6">
              {currentUser?.userRole !== "seller" ? (
                <Card>
                  <CardContent className="text-center py-8 sm:py-12">
                    <p className="text-gray-600">Only sellers can receive inquiries</p>
                  </CardContent>
                </Card>
              ) : isFetchingData ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : receivedInquiries.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 sm:py-12">
                    <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No inquiries received yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  {receivedInquiries.map((inquiry) => (
                    <InquiryCard key={inquiry.id} inquiry={inquiry} type="received" />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
