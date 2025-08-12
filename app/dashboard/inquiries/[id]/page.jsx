"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import AuthGuard from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { getClientPb } from "@/lib/pocketbase"
import { ArrowLeft, Send, MessageSquare, Lock, Clock, CheckCircle, XCircle } from "lucide-react"
import { Package, FileText } from "lucide-react"
import { safeDecryptMessage, isEncryptedMessage } from "@/lib/message-utils"

const MAX_MESSAGES_PER_USER = 17
const MAX_TOTAL_MESSAGES = 34

export default function InquiryDetailPage() {
  const { currentUser, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const pb = getClientPb()

  const [inquiry, setInquiry] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isFetchingData, setIsFetchingData] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [userMessageCount, setUserMessageCount] = useState(0)
  const messagesEndRef = useRef(null)
  const lockTimeoutRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchInquiry = useCallback(
    async (signal) => {
      if (!params.id || !currentUser?.id) {
        setIsFetchingData(false)
        return
      }

      setIsFetchingData(true)
      try {
        const record = await pb.collection("inquiries").getOne(params.id, {
          expand: "buyer,seller,product,requirement",
          signal,
        })

        // Check if user is authorized to view this inquiry
        if (record.buyer !== currentUser.id && record.seller !== currentUser.id) {
          router.push("/dashboard/inquiries")
          return
        }

        setInquiry(record)

        // Handle mixed encrypted/plain text messages
        const processedMessages = (record.chat || []).map((msg) => ({
          ...msg,
          message: safeDecryptMessage(msg.message),
        }))
        setMessages(processedMessages)

        // Count user's messages
        const userMsgCount = processedMessages.filter((msg) => msg.sender === currentUser.id).length
        setUserMessageCount(userMsgCount)
      } catch (err) {
        if (err.name === "AbortError" || err.message?.includes("autocancelled")) {
          return
        }
        console.error("Failed to fetch inquiry:", err)
        router.push("/dashboard/inquiries")
      } finally {
        setIsFetchingData(false)
      }
    },
    [params.id, currentUser, pb, router],
  )

  useEffect(() => {
    if (!params.id || !currentUser?.id) return

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      fetchInquiry(controller.signal)
    }, 100)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [params.id, currentUser?.id, fetchInquiry])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Cleanup lock timeout on unmount
  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current)
      }
    }
  }, [])

  const acquireLock = async () => {
    setIsLocked(true)
    // Auto-release lock after 30 seconds
    lockTimeoutRef.current = setTimeout(() => {
      setIsLocked(false)
    }, 30000)
  }

  const releaseLock = () => {
    setIsLocked(false)
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current)
      lockTimeoutRef.current = null
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!newMessage.trim() || isSending || isLocked) return

    // Check if inquiry is approved
    if (inquiry.approvalStatus !== "approved") {
      alert("This inquiry must be approved by admin before you can send messages.")
      return
    }

    // Check message limits
    if (userMessageCount >= MAX_MESSAGES_PER_USER) {
      alert(`You have reached the maximum limit of ${MAX_MESSAGES_PER_USER} messages.`)
      return
    }

    if (messages.length >= MAX_TOTAL_MESSAGES) {
      alert(`This conversation has reached the maximum limit of ${MAX_TOTAL_MESSAGES} messages.`)
      return
    }

    setIsSending(true)
    await acquireLock()

    try {
      const messageData = {
        id: Date.now().toString(),
        sender: currentUser.id,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      }

      const updatedChat = [...(inquiry.chat || []), messageData]

      await pb.collection("inquiries").update(inquiry.id, {
        chat: updatedChat,
        status: "replied",
      })

      // Update local state with decrypted message
      setMessages((prev) => [...prev, messageData])

      setUserMessageCount((prev) => prev + 1)
      setNewMessage("")

      // Update inquiry status
      setInquiry((prev) => ({
        ...prev,
        chat: updatedChat,
        status: "replied",
      }))
    } catch (error) {
      console.error("Failed to send message:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setIsSending(false)
      releaseLock()
    }
  }

  const getApprovalStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getApprovalStatusBadge = (status) => {
    const variant = status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"
    return <Badge variant={variant}>{status}</Badge>
  }

  const getApprovalStatusMessage = (status) => {
    switch (status) {
      case "approved":
        return "This inquiry has been approved. You can now chat with each other."
      case "rejected":
        return "This inquiry has been rejected by admin. Chat is not available."
      default:
        return "This inquiry is pending admin approval. Chat will be available once approved."
    }
  }

  if (isLoading || isFetchingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  if (!inquiry) {
    return (
      <AuthGuard redirectIfNotAuthenticated="/login">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="text-center py-8">
              <p className="text-gray-600">Inquiry not found</p>
              <Button onClick={() => router.push("/dashboard/inquiries")} className="mt-4">
                Back to Inquiries
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  const isProduct = !!inquiry.product
  const targetItem = isProduct ? inquiry.expand?.product : inquiry.expand?.requirement
  const otherUser = inquiry.buyer === currentUser.id ? inquiry.expand?.seller : inquiry.expand?.buyer
  const isApproved = inquiry.approvalStatus === "approved"
  const canSendMessage = isApproved && userMessageCount < MAX_MESSAGES_PER_USER && messages.length < MAX_TOTAL_MESSAGES

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/inquiries")} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Inquiries
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{isProduct ? "Product" : "Requirement"} Inquiry</h1>
              <p className="text-gray-600">
                Conversation with {otherUser?.firstName} {otherUser?.lastName}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {userMessageCount}/{MAX_MESSAGES_PER_USER} messages
              </Badge>
              {isLocked && (
                <div className="flex items-center text-yellow-600">
                  <Lock className="w-4 h-4 mr-1" />
                  <span className="text-sm">Locked</span>
                </div>
              )}
            </div>
          </div>

          {/* Approval Status Alert */}
          <div className="mb-6">
            <Card
              className={`border-l-4 ${
                inquiry.approvalStatus === "approved"
                  ? "border-green-400 bg-green-50"
                  : inquiry.approvalStatus === "rejected"
                    ? "border-red-400 bg-red-50"
                    : "border-yellow-400 bg-yellow-50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  {getApprovalStatusIcon(inquiry.approvalStatus)}
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-medium ${
                          inquiry.approvalStatus === "approved"
                            ? "text-green-800"
                            : inquiry.approvalStatus === "rejected"
                              ? "text-red-800"
                              : "text-yellow-800"
                        }`}
                      >
                        Inquiry Status: {getApprovalStatusBadge(inquiry.approvalStatus)}
                      </p>
                    </div>
                    <p
                      className={`text-sm mt-1 ${
                        inquiry.approvalStatus === "approved"
                          ? "text-green-700"
                          : inquiry.approvalStatus === "rejected"
                            ? "text-red-700"
                            : "text-yellow-700"
                      }`}
                    >
                      {getApprovalStatusMessage(inquiry.approvalStatus)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Item Details */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {isProduct ? (
                      <Package className="w-5 h-5 mr-2 text-blue-600" />
                    ) : (
                      <FileText className="w-5 h-5 mr-2 text-green-600" />
                    )}
                    {isProduct ? "Product Details" : "Requirement Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{targetItem?.title || targetItem?.quoteFor}</h4>
                      <p className="text-sm text-gray-600">{targetItem?.category}</p>
                    </div>

                    {targetItem?.description && (
                      <div>
                        <h4 className="font-medium text-gray-900">Description</h4>
                        <p className="text-sm text-gray-600">{targetItem.description}</p>
                      </div>
                    )}

                    {targetItem?.requirementDetails && (
                      <div>
                        <h4 className="font-medium text-gray-900">Details</h4>
                        <p className="text-sm text-gray-600">{targetItem.requirementDetails}</p>
                      </div>
                    )}

                    {isProduct && targetItem?.price && (
                      <div>
                        <h4 className="font-medium text-gray-900">Price</h4>
                        <p className="text-sm text-gray-600">
                          ₹{targetItem.price} / {targetItem.measurement}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      {isApproved ? `Messages (${messages.length}/${MAX_TOTAL_MESSAGES})` : "Initial Inquiry"}
                    </CardTitle>
                    <Badge variant={inquiry.status === "replied" ? "default" : "secondary"}>{inquiry.status}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Initial Inquiry Message - Always Visible */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-blue-900">Initial Inquiry</span>
                      <span className="text-xs text-blue-600">{new Date(inquiry.created).toLocaleString()}</span>
                    </div>
                    <p className="text-blue-800">{inquiry.message}</p>
                  </div>

                  {/* Chat Messages - Only if Approved */}
                  {isApproved ? (
                    <>
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 max-h-96">
                        {messages.map((message) => {
                          const isCurrentUser = message.sender === currentUser.id
                          const isEncrypted = isEncryptedMessage(message.message)
                          return (
                            <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words ${
                                  isCurrentUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
                                } ${isEncrypted ? "border-2 border-yellow-400" : ""}`}
                              >
                                <p className="text-sm break-words">{message.message}</p>
                                {isEncrypted && <p className="text-xs mt-1 text-yellow-200">⚠️ Encrypted message</p>}
                                <p className={`text-xs mt-1 ${isCurrentUser ? "text-blue-100" : "text-gray-500"}`}>
                                  {new Date(message.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Message Input */}
                      <form onSubmit={handleSendMessage} className="flex space-x-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={
                            !canSendMessage
                              ? "Message limit reached"
                              : isLocked
                                ? "Chat is locked..."
                                : "Type your message..."
                          }
                          disabled={!canSendMessage || isLocked || isSending}
                          className="flex-1"
                        />
                        <Button type="submit" disabled={!canSendMessage || isLocked || isSending || !newMessage.trim()}>
                          {isSending ? <LoadingSpinner size={16} /> : <Send className="w-4 h-4" />}
                        </Button>
                      </form>

                      {!canSendMessage && isApproved && (
                        <p className="text-sm text-red-600 mt-2 text-center">
                          {userMessageCount >= MAX_MESSAGES_PER_USER
                            ? `You have reached your message limit (${MAX_MESSAGES_PER_USER} messages)`
                            : `This conversation has reached the maximum limit (${MAX_TOTAL_MESSAGES} messages)`}
                        </p>
                      )}
                    </>
                  ) : (
                    /* Not Approved - Show Status Message */
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center py-12">
                        {inquiry.approvalStatus === "rejected" ? (
                          <div>
                            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Inquiry Rejected</h3>
                            <p className="text-gray-600">
                              This inquiry has been rejected by admin. Chat functionality is not available.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Awaiting Approval</h3>
                            <p className="text-gray-600">
                              Your inquiry is pending admin approval. Chat will be available once approved.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
