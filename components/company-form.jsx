"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { companyTypes, countries } from "@/lib/constants"
import { Plus, X, Edit, Save, Trash, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

// Improved JSON parsing with better error handling
function parseJsonField(jsonData) {
  // Handle null, undefined, or empty values
  if (!jsonData || jsonData === "null" || jsonData === null || jsonData === undefined) {
    return []
  }

  // If it's already an array, just add IDs and return
  if (Array.isArray(jsonData)) {
    return jsonData.map((item) => ({
      ...item,
      id: item.id || crypto.randomUUID(),
    }))
  }

  // If it's already an object (but not array), wrap it in array
  if (typeof jsonData === "object") {
    return [{ ...jsonData, id: jsonData.id || crypto.randomUUID() }]
  }

  // If it's a string, try to parse it
  if (typeof jsonData === "string") {
    const trimmed = jsonData.trim()
    if (trimmed === "" || trimmed === "null") {
      return []
    }

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
        }))
      }
      if (typeof parsed === "object" && parsed !== null) {
        return [{ ...parsed, id: parsed.id || crypto.randomUUID() }]
      }
      return []
    } catch (e) {
      console.error("Error parsing JSON field:", e, jsonData)
      return []
    }
  }

  // For any other data type, return empty array
  console.warn("Unexpected data type for JSON field:", typeof jsonData, jsonData)
  return []
}

// Improved JSON stringification
function stringifyJsonField(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return "[]"
  }

  try {
    // Remove temporary IDs and any undefined/null values before saving
    const cleanData = data
      .filter((item) => item && typeof item === "object")
      .map(({ id, ...rest }) => {
        // Remove any undefined or null values
        const cleanItem = {}
        Object.keys(rest).forEach((key) => {
          if (rest[key] !== undefined && rest[key] !== null) {
            cleanItem[key] = rest[key]
          }
        })
        return cleanItem
      })

    return JSON.stringify(cleanData)
  } catch (e) {
    console.error("Error stringifying JSON field:", e, data)
    return "[]"
  }
}

export default function CompanyForm({ onSubmissionSuccess }) {
  const { pb, currentUser, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Basic company information
  const [companyId, setCompanyId] = useState(null)
  const [companyName, setCompanyName] = useState("")
  const [companyLogo, setCompanyLogo] = useState(null)
  const [companyLogoUrl, setCompanyLogoUrl] = useState(null)
  const [description, setDescription] = useState("")
  const [website, setWebsite] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [pincode, setPincode] = useState("")
  const [country, setCountry] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [foundedYear, setFoundedYear] = useState("")
  const [employeeCount, setEmployeeCount] = useState("")
  const [annualTurnover, setAnnualTurnover] = useState("")
  const [companyType, setCompanyType] = useState("")

  // JV Details with improved state management
  const [jvDetails, setJvDetails] = useState([])
  const [newJvDetail, setNewJvDetail] = useState({
    name: "",
    country: "",
    products: "",
    type: "",
    holding: 0,
  })
  const [editingJvId, setEditingJvId] = useState(null)

  // Collaboration Details
  const [collaborationDetails, setCollaborationDetails] = useState([])
  const [newCollaboration, setNewCollaboration] = useState({
    name: "",
    country: "",
    type: "",
  })
  const [editingCollabId, setEditingCollabId] = useState(null)

  // Standard Details
  const [standardDetails, setStandardDetails] = useState([])
  const [newStandard, setNewStandard] = useState({
    standard: "",
    institute: "",
    remark: "",
    date: "",
  })
  const [editingStandardId, setEditingStandardId] = useState(null)

  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isError, setIsError] = useState(false)
  const [fetchTimeout, setFetchTimeout] = useState(null)

  // Improved data fetching with better error handling
  const fetchCompanyData = useCallback(async () => {
    if (!currentUser?.id || authLoading) {
      setIsFetching(false)
      return
    }

    setIsFetching(true)
    setError(null)

    try {
      // Remove requestKey to avoid auto-cancellation issues
      // Use a simple filter instead
      const record = await pb.collection("companies").getFirstListItem(`user="${currentUser.id}"`)

      // Set basic company information
      setCompanyId(record.id)
      setCompanyName(record.companyName || "")
      setDescription(record.description || "")
      setWebsite(record.website || "")
      setAddress(record.address || "")
      setCity(record.city || "")
      setState(record.state || "")
      setPincode(record.pincode || "")
      setCountry(record.country || "")
      setPhone(record.phone || "")
      setEmail(record.email || "")
      setFoundedYear(record.foundedYear || "")
      setEmployeeCount(record.employeeCount || "")
      setAnnualTurnover(record.annualTurnover || "")
      setCompanyType(record.companyType || "")

      // Handle JSON fields with improved parsing and debugging
      console.log("Raw data from PocketBase:")
      console.log("JV Details type:", typeof record.jvDetails, "Value:", record.jvDetails)
      console.log(
        "Collaboration Details type:",
        typeof record.collaborationDetails,
        "Value:",
        record.collaborationDetails,
      )
      console.log("Standard Details type:", typeof record.standardDetails, "Value:", record.standardDetails)

      const parsedJvDetails = parseJsonField(record.jvDetails)
      const parsedCollaborationDetails = parseJsonField(record.collaborationDetails)
      const parsedStandardDetails = parseJsonField(record.standardDetails)

      console.log("Parsed results:")
      console.log("JV Details:", parsedJvDetails)
      console.log("Collaboration Details:", parsedCollaborationDetails)
      console.log("Standard Details:", parsedStandardDetails)

      setJvDetails(parsedJvDetails)
      setCollaborationDetails(parsedCollaborationDetails)
      setStandardDetails(parsedStandardDetails)

      // Handle company logo
      if (record.companyLogo) {
        const logoUrl = pb.files.getUrl(record, record.companyLogo)
        setCompanyLogoUrl(logoUrl)
        setCompanyLogo(record.companyLogo)
      } else {
        setCompanyLogoUrl(null)
        setCompanyLogo(null)
      }

      setMessage("Company data loaded successfully.")
      setIsError(false)
    } catch (err) {
      // Handle auto-cancellation gracefully
      if (err.isAbort || err.name === "AbortError" || err.message?.includes("autocancelled")) {
        console.log("Request was cancelled, this is normal when navigating quickly")
        return // Don't show error for cancelled requests
      }

      if (err.status === 404) {
        setMessage("No company details found. Please add your company information.")
        setIsError(false)
        // Reset form for new company
        resetForm()
      } else {
        console.error("Failed to fetch company data:", err)
        setError(err.message || "Failed to load company data.")
        setIsError(true)
      }
    } finally {
      setIsFetching(false)
    }
  }, [currentUser?.id, pb, authLoading])

  // Reset form function
  const resetForm = () => {
    setCompanyId(null)
    setCompanyName("")
    setCompanyLogo(null)
    setCompanyLogoUrl(null)
    setDescription("")
    setWebsite("")
    setAddress("")
    setCity("")
    setState("")
    setPincode("")
    setCountry("")
    setPhone("")
    setEmail("")
    setFoundedYear("")
    setEmployeeCount("")
    setAnnualTurnover("")
    setCompanyType("")
    setJvDetails([])
    setCollaborationDetails([])
    setStandardDetails([])
  }

  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeout) {
      clearTimeout(fetchTimeout)
    }

    // Debounce the fetch call to prevent rapid successive requests
    const timeout = setTimeout(() => {
      fetchCompanyData()
    }, 100) // 100ms debounce

    setFetchTimeout(timeout)

    // Cleanup timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [fetchCompanyData])

  // Add this useEffect after the existing fetchCompanyData useEffect
  useEffect(() => {
    // Cleanup function to cancel any pending requests when component unmounts
    return () => {
      // Cancel any pending PocketBase requests
      if (pb?.cancelAllRequests) {
        pb.cancelAllRequests()
      }
    }
  }, [pb])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCompanyLogo(e.target.files[0])
      setCompanyLogoUrl(URL.createObjectURL(e.target.files[0]))
    }
  }

  const handleRemoveLogo = () => {
    setCompanyLogo(null)
    setCompanyLogoUrl(null)
  }

  // Improved JV Details Handlers
  const handleJvInputChange = (field, value) => {
    setNewJvDetail((prev) => ({
      ...prev,
      [field]: field === "holding" ? Number(value) || 0 : value,
    }))
  }

  const validateJvDetail = (jvDetail) => {
    if (!jvDetail.name.trim()) {
      return "JV Name is required"
    }
    return null
  }

  const handleAddJvDetail = () => {
    const validationError = validateJvDetail(newJvDetail)
    if (validationError) {
      setError(validationError)
      return
    }

    const newJv = { ...newJvDetail, id: crypto.randomUUID() }
    setJvDetails((prev) => [...prev, newJv])
    setNewJvDetail({ name: "", country: "", products: "", type: "", holding: 0 })
    setError(null)
  }

  const handleEditJvDetail = (id) => {
    const jvToEdit = jvDetails.find((jv) => jv.id === id)
    if (jvToEdit) {
      setNewJvDetail({ ...jvToEdit })
      setEditingJvId(id)
    }
  }

  const handleUpdateJvDetail = () => {
    const validationError = validateJvDetail(newJvDetail)
    if (validationError) {
      setError(validationError)
      return
    }

    setJvDetails((prev) => prev.map((jv) => (jv.id === editingJvId ? { ...newJvDetail, id: editingJvId } : jv)))
    setNewJvDetail({ name: "", country: "", products: "", type: "", holding: 0 })
    setEditingJvId(null)
    setError(null)
  }

  const handleRemoveJvDetail = (id) => {
    setJvDetails((prev) => prev.filter((jv) => jv.id !== id))
    if (editingJvId === id) {
      setEditingJvId(null)
      setNewJvDetail({ name: "", country: "", products: "", type: "", holding: 0 })
    }
  }

  const handleCancelJvEdit = () => {
    setEditingJvId(null)
    setNewJvDetail({ name: "", country: "", products: "", type: "", holding: 0 })
  }

  // Improved Collaboration Details Handlers
  const handleCollabInputChange = (field, value) => {
    setNewCollaboration((prev) => ({ ...prev, [field]: value }))
  }

  const validateCollaboration = (collaboration) => {
    if (!collaboration.name.trim()) {
      return "Collaboration Name is required"
    }
    return null
  }

  const handleAddCollaboration = () => {
    const validationError = validateCollaboration(newCollaboration)
    if (validationError) {
      setError(validationError)
      return
    }

    const newCollab = { ...newCollaboration, id: crypto.randomUUID() }
    setCollaborationDetails((prev) => [...prev, newCollab])
    setNewCollaboration({ name: "", country: "", type: "" })
    setError(null)
  }

  const handleEditCollaboration = (id) => {
    const collabToEdit = collaborationDetails.find((collab) => collab.id === id)
    if (collabToEdit) {
      setNewCollaboration({ ...collabToEdit })
      setEditingCollabId(id)
    }
  }

  const handleUpdateCollaboration = () => {
    const validationError = validateCollaboration(newCollaboration)
    if (validationError) {
      setError(validationError)
      return
    }

    setCollaborationDetails((prev) =>
      prev.map((collab) => (collab.id === editingCollabId ? { ...newCollaboration, id: editingCollabId } : collab)),
    )
    setNewCollaboration({ name: "", country: "", type: "" })
    setEditingCollabId(null)
    setError(null)
  }

  const handleRemoveCollaboration = (id) => {
    setCollaborationDetails((prev) => prev.filter((collab) => collab.id !== id))
    if (editingCollabId === id) {
      setEditingCollabId(null)
      setNewCollaboration({ name: "", country: "", type: "" })
    }
  }

  const handleCancelCollabEdit = () => {
    setEditingCollabId(null)
    setNewCollaboration({ name: "", country: "", type: "" })
  }

  // Improved Standard Details Handlers
  const handleStandardInputChange = (field, value) => {
    setNewStandard((prev) => ({ ...prev, [field]: value }))
  }

  const validateStandard = (standard) => {
    if (!standard.standard.trim()) {
      return "Standard name is required"
    }
    return null
  }

  const handleAddStandard = () => {
    const validationError = validateStandard(newStandard)
    if (validationError) {
      setError(validationError)
      return
    }

    const newStd = { ...newStandard, id: crypto.randomUUID() }
    setStandardDetails((prev) => [...prev, newStd])
    setNewStandard({ standard: "", institute: "", remark: "", date: "" })
    setError(null)
  }

  const handleEditStandard = (id) => {
    const stdToEdit = standardDetails.find((std) => std.id === id)
    if (stdToEdit) {
      setNewStandard({ ...stdToEdit })
      setEditingStandardId(id)
    }
  }

  const handleUpdateStandard = () => {
    const validationError = validateStandard(newStandard)
    if (validationError) {
      setError(validationError)
      return
    }

    setStandardDetails((prev) =>
      prev.map((std) => (std.id === editingStandardId ? { ...newStandard, id: editingStandardId } : std)),
    )
    setNewStandard({ standard: "", institute: "", remark: "", date: "" })
    setEditingStandardId(null)
    setError(null)
  }

  const handleRemoveStandard = (id) => {
    setStandardDetails((prev) => prev.filter((std) => std.id !== id))
    if (editingStandardId === id) {
      setEditingStandardId(null)
      setNewStandard({ standard: "", institute: "", remark: "", date: "" })
    }
  }

  const handleCancelStandardEdit = () => {
    setEditingStandardId(null)
    setNewStandard({ standard: "", institute: "", remark: "", date: "" })
  }

  // Improved form submission
  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    if (!currentUser?.id) {
      setError("User not authenticated.")
      setIsSubmitting(false)
      return
    }

    try {
      const formData = new FormData()
      const companyData = {
        user: currentUser.id,
        companyName,
        description,
        website,
        address,
        city,
        state,
        pincode,
        country,
        phone,
        email,
        foundedYear: String(foundedYear),
        employeeCount,
        annualTurnover,
        companyType,
        approvalStatus: "pending",
        companyLogo,
        jvDetails: stringifyJsonField(jvDetails),
        collaborationDetails: stringifyJsonField(collaborationDetails),
        standardDetails: stringifyJsonField(standardDetails),
      }

      Object.keys(companyData).forEach((key) => {
        if (key === "companyLogo" && companyData[key]) {
          formData.append(key, companyData[key])
        } else if (key !== "companyLogo") {
          formData.append(key, companyData[key])
        }
      })

      console.log("Submitting JV Details:", stringifyJsonField(jvDetails))
      console.log("Submitting Collaboration Details:", stringifyJsonField(collaborationDetails))
      console.log("Submitting Standard Details:", stringifyJsonField(standardDetails))

      if (companyId) {
        await pb.collection("companies").update(companyId, formData)
        setMessage("Company details updated successfully! Awaiting admin approval.")
      } else {
        const newRecord = await pb.collection("companies").create(formData)
        setMessage("Company details added successfully! Awaiting admin approval.")
        setCompanyId(newRecord.id)
      }

      try {
        const emailResponse = await fetch("/api/send-company-emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyData: {
              companyName: companyData.companyName,
              companyEmail: companyData.email,
              companyPhone: companyData.phone,
              companyAddress: companyData.address,
              companyDescription: companyData.description,
            },
            userEmail: companyData.email,
            isUpdate: !!companyId,
          }),
        })

        const emailResult = await emailResponse.json()
        if (!emailResult.success) {
          console.error("Email sending failed:", emailResult.error)
        }
      } catch (emailError) {
        console.error("Email API call failed:", emailError)
        // Don't fail the main operation if email fails
      }

      setIsError(false)
      if (onSubmissionSuccess) {
        onSubmissionSuccess()
      }
    } catch (err) {
      console.error("Company form submission failed:", err)
      setError(err.message || "Failed to save company details.")
      setIsError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {companyId ? "Edit Company Details" : "Add Company Details"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert variant={isError ? "destructive" : "default"} className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name*</Label>
                  <Input
                    id="companyName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="companyLogo">Company Logo</Label>
                  <Input
                    id="companyLogo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                  {companyLogoUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={companyLogoUrl || "/placeholder.svg"}
                        alt="Company Logo Preview"
                        className="h-16 w-16 object-contain border rounded"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveLogo}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove logo</span>
                      </Button>
                    </div>
                  )}
                </div>
                <div className="col-span-full">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Company Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="foundedYear">Founded Year</Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="employeeCount">Employee Count</Label>
                  <Input
                    id="employeeCount"
                    type="text"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="annualTurnover">Annual Turnover</Label>
                  <Input
                    id="annualTurnover"
                    type="text"
                    value={annualTurnover}
                    onChange={(e) => setAnnualTurnover(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="companyType">Company Type</Label>
                  <Select value={companyType} onValueChange={setCompanyType} disabled={isSubmitting}>
                    <SelectTrigger id="companyType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={country} onValueChange={setCountry} disabled={isSubmitting}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* JV Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                JV Details
                <Badge variant="secondary">{jvDetails.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Form for JV Details */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="jv-name">Name*</Label>
                  <Input
                    id="jv-name"
                    value={newJvDetail.name}
                    onChange={(e) => handleJvInputChange("name", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter JV name"
                  />
                </div>
                <div>
                  <Label htmlFor="jv-country">Country</Label>
                  <Input
                    id="jv-country"
                    value={newJvDetail.country}
                    onChange={(e) => handleJvInputChange("country", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter country"
                  />
                </div>
                <div>
                  <Label htmlFor="jv-products">Products</Label>
                  <Input
                    id="jv-products"
                    value={newJvDetail.products}
                    onChange={(e) => handleJvInputChange("products", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter products"
                  />
                </div>
                <div>
                  <Label htmlFor="jv-type">Type</Label>
                  <Input
                    id="jv-type"
                    value={newJvDetail.type}
                    onChange={(e) => handleJvInputChange("type", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter type"
                  />
                </div>
                <div>
                  <Label htmlFor="jv-holding">Holding (%)</Label>
                  <Input
                    id="jv-holding"
                    type="number"
                    min="0"
                    max="100"
                    value={newJvDetail.holding}
                    onChange={(e) => handleJvInputChange("holding", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="0"
                  />
                </div>
                <div className="md:col-span-5 flex justify-end gap-2 mt-2">
                  {editingJvId && (
                    <Button type="button" variant="outline" onClick={handleCancelJvEdit} disabled={isSubmitting}>
                      Cancel
                    </Button>
                  )}
                  {editingJvId ? (
                    <Button
                      type="button"
                      onClick={handleUpdateJvDetail}
                      disabled={isSubmitting}
                      className="flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" /> Update JV
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleAddJvDetail}
                      disabled={isSubmitting}
                      className="flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add JV
                    </Button>
                  )}
                </div>
              </div>

              {/* Table for JV Details */}
              {jvDetails.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Holding (%)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jvDetails.map((jv) => (
                        <TableRow key={jv.id} className={editingJvId === jv.id ? "bg-muted/50" : ""}>
                          <TableCell className="font-medium">{jv.name}</TableCell>
                          <TableCell>{jv.country || "-"}</TableCell>
                          <TableCell>{jv.products || "-"}</TableCell>
                          <TableCell>{jv.type || "-"}</TableCell>
                          <TableCell>{jv.holding}%</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditJvDetail(jv.id)}
                                disabled={isSubmitting || editingJvId === jv.id}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveJvDetail(jv.id)}
                                disabled={isSubmitting}
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No JV details added yet.</p>
                  <p className="text-sm">Add your first JV detail using the form above.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Collaboration Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Collaboration Details
                <Badge variant="secondary">{collaborationDetails.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Form for Collaboration Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="collab-name">Name*</Label>
                  <Input
                    id="collab-name"
                    value={newCollaboration.name}
                    onChange={(e) => handleCollabInputChange("name", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter collaboration name"
                  />
                </div>
                <div>
                  <Label htmlFor="collab-country">Country</Label>
                  <Input
                    id="collab-country"
                    value={newCollaboration.country}
                    onChange={(e) => handleCollabInputChange("country", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter country"
                  />
                </div>
                <div>
                  <Label htmlFor="collab-type">Type</Label>
                  <Input
                    id="collab-type"
                    value={newCollaboration.type}
                    onChange={(e) => handleCollabInputChange("type", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter type"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                  {editingCollabId && (
                    <Button type="button" variant="outline" onClick={handleCancelCollabEdit} disabled={isSubmitting}>
                      Cancel
                    </Button>
                  )}
                  {editingCollabId ? (
                    <Button
                      type="button"
                      onClick={handleUpdateCollaboration}
                      disabled={isSubmitting}
                      className="flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" /> Update Collaboration
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleAddCollaboration}
                      disabled={isSubmitting}
                      className="flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Collaboration
                    </Button>
                  )}
                </div>
              </div>

              {/* Table for Collaboration Details */}
              {collaborationDetails.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collaborationDetails.map((collab) => (
                        <TableRow key={collab.id} className={editingCollabId === collab.id ? "bg-muted/50" : ""}>
                          <TableCell className="font-medium">{collab.name}</TableCell>
                          <TableCell>{collab.country || "-"}</TableCell>
                          <TableCell>{collab.type || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCollaboration(collab.id)}
                                disabled={isSubmitting || editingCollabId === collab.id}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveCollaboration(collab.id)}
                                disabled={isSubmitting}
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No collaboration details added yet.</p>
                  <p className="text-sm">Add your first collaboration using the form above.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Standard Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Standard Details
                <Badge variant="secondary">{standardDetails.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Form for Standard Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="std-standard">Standard*</Label>
                  <Input
                    id="std-standard"
                    value={newStandard.standard}
                    onChange={(e) => handleStandardInputChange("standard", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter standard name"
                  />
                </div>
                <div>
                  <Label htmlFor="std-institute">Institute</Label>
                  <Input
                    id="std-institute"
                    value={newStandard.institute}
                    onChange={(e) => handleStandardInputChange("institute", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter institute"
                  />
                </div>
                <div>
                  <Label htmlFor="std-remark">Remark</Label>
                  <Input
                    id="std-remark"
                    value={newStandard.remark}
                    onChange={(e) => handleStandardInputChange("remark", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter remark"
                  />
                </div>
                <div>
                  <Label htmlFor="std-date">Date</Label>
                  <Input
                    id="std-date"
                    type="date"
                    value={newStandard.date}
                    onChange={(e) => handleStandardInputChange("date", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                  {editingStandardId && (
                    <Button type="button" variant="outline" onClick={handleCancelStandardEdit} disabled={isSubmitting}>
                      Cancel
                    </Button>
                  )}
                  {editingStandardId ? (
                    <Button
                      type="button"
                      onClick={handleUpdateStandard}
                      disabled={isSubmitting}
                      className="flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" /> Update Standard
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleAddStandard}
                      disabled={isSubmitting}
                      className="flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Standard
                    </Button>
                  )}
                </div>
              </div>

              {/* Table for Standard Details */}
              {standardDetails.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Standard</TableHead>
                        <TableHead>Institute</TableHead>
                        <TableHead>Remark</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standardDetails.map((std) => (
                        <TableRow key={std.id} className={editingStandardId === std.id ? "bg-muted/50" : ""}>
                          <TableCell className="font-medium">{std.standard}</TableCell>
                          <TableCell>{std.institute || "-"}</TableCell>
                          <TableCell>{std.remark || "-"}</TableCell>
                          <TableCell>{std.date || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditStandard(std.id)}
                                disabled={isSubmitting || editingStandardId === std.id}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveStandard(std.id)}
                                disabled={isSubmitting}
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No standard details added yet.</p>
                  <p className="text-sm">Add your first standard using the form above.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
              {isSubmitting ? "Saving..." : companyId ? "Update Company" : "Add Company"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
