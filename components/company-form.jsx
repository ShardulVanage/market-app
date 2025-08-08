"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { companyTypes, countries } from "@/lib/constants";
import { Plus, X, Edit, Save, Trash } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function parseJsonField(jsonString) {
  if (!jsonString || typeof jsonString !== 'string' || jsonString === "null" || jsonString.trim() === "") {
    return [];
  }
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed.map(item => ({ ...item, id: item.id || crypto.randomUUID() })) : [];
  } catch (e) {
    console.error("Error parsing JSON field:", e, jsonString);
    return [];
  }
}

export default function CompanyForm({ onSubmissionSuccess }) {
  const { pb, currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(null);
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [foundedYear, setFoundedYear] = useState('');
  const [employeeCount, setEmployeeCount] = useState("");
  const [annualTurnover, setAnnualTurnover] = useState("");
  const [companyType, setCompanyType] = useState("");
  
  // JV Details
  const [jvDetails, setJvDetails] = useState([]);
  const [newJvDetail, setNewJvDetail] = useState({
    name: "",
    country: "",
    products: "",
    type: "",
    holding: 0
  });
  const [editingJvId, setEditingJvId] = useState(null);
  
  // Collaboration Details
  const [collaborationDetails, setCollaborationDetails] = useState([]);
  const [newCollaboration, setNewCollaboration] = useState({
    name: "",
    country: "",
    type: ""
  });
  const [editingCollabId, setEditingCollabId] = useState(null);
  
  // Standard Details
  const [standardDetails, setStandardDetails] = useState([]);
  const [newStandard, setNewStandard] = useState({
    standard: "",
    institute: "",
    remark: "",
    date: ""
  });
  const [editingStandardId, setEditingStandardId] = useState(null);
  
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchCompanyData = useCallback(async () => {
    if (!currentUser?.id || authLoading) {
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    setError(null);
    try {
      // Use a timestamp to make each request key unique
      const timestamp = new Date().getTime();
      const record = await pb.collection("companies").getFirstListItem(`user="${currentUser.id}"`, {
        requestKey: `company-form-fetch-${currentUser.id}-${timestamp}`,
      });

      setCompanyId(record.id);
      setCompanyName(record.companyName || "");
      setDescription(record.description || "");
      setWebsite(record.website || "");
      setAddress(record.address || "");
      setCity(record.city || "");
      setState(record.state || "");
      setPincode(record.pincode || "");
      setCountry(record.country || "");
      setPhone(record.phone || "");
      setEmail(record.email || "");
      setFoundedYear(record.foundedYear || '');
      setEmployeeCount(record.employeeCount || "");
      setAnnualTurnover(record.annualTurnover || "");
      setCompanyType(record.companyType || "");

      // Handle JSON fields
      setJvDetails(parseJsonField(record.jvDetails));
      setCollaborationDetails(parseJsonField(record.collaborationDetails));
      setStandardDetails(parseJsonField(record.standardDetails));

      // Handle company logo
      if (record.companyLogo) {
        const logoUrl = pb.files.getUrl(record, record.companyLogo);
        setCompanyLogoUrl(logoUrl);
        setCompanyLogo(record.companyLogo);
      } else {
        setCompanyLogoUrl(null);
        setCompanyLogo(null);
      }
      setMessage("Company data loaded successfully.");
      setIsError(false);
    } catch (err) {
      if (err.status === 404) {
        setMessage("No company details found. Please add your company.");
        setIsError(false);
        // Clear form if no company found
        setCompanyId(null);
        setCompanyName("");
        setCompanyLogo(null);
        setCompanyLogoUrl(null);
        setDescription("");
        setWebsite("");
        setAddress("");
        setCity("");
        setState("");
        setPincode("");
        setCountry("");
        setPhone("");
        setEmail("");
        setFoundedYear('');
        setEmployeeCount("");
        setAnnualTurnover("");
        setCompanyType("");
        setJvDetails([]);
        setCollaborationDetails([]);
        setStandardDetails([]);
      } else {
        console.error("Failed to fetch company data:", err);
        setError(err.message || "Failed to load company data.");
      }
    } finally {
      setIsFetching(false);
    }
  }, [currentUser?.id, pb, authLoading]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCompanyLogo(e.target.files[0]);
      setCompanyLogoUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleRemoveLogo = () => {
    setCompanyLogo(null);
    setCompanyLogoUrl(null);
  };

  // JV Details Handlers
  const handleJvInputChange = (field, value) => {
    setNewJvDetail(prev => ({ ...prev, [field]: field === 'holding' ? Number(value) : value }));
  };

  const handleAddJvDetail = () => {
    if (!newJvDetail.name) {
      alert("JV Name is required");
      return;
    }
    
    const newJv = { ...newJvDetail, id: crypto.randomUUID() };
    setJvDetails(prev => [...prev, newJv]);
    setNewJvDetail({ name: "", country: "", products: "", type: "", holding: 0 });
  };

  const handleEditJvDetail = (id) => {
    const jvToEdit = jvDetails.find(jv => jv.id === id);
    if (jvToEdit) {
      setNewJvDetail({ ...jvToEdit });
      setEditingJvId(id);
    }
  };

  const handleUpdateJvDetail = () => {
    if (!newJvDetail.name) {
      alert("JV Name is required");
      return;
    }
    
    setJvDetails(prev => 
      prev.map(jv => jv.id === editingJvId ? { ...newJvDetail, id: editingJvId } : jv)
    );
    setNewJvDetail({ name: "", country: "", products: "", type: "", holding: 0 });
    setEditingJvId(null);
  };

  const handleRemoveJvDetail = (id) => {
    setJvDetails(prev => prev.filter(jv => jv.id !== id));
    if (editingJvId === id) {
      setEditingJvId(null);
      setNewJvDetail({ name: "", country: "", products: "", type: "", holding: 0 });
    }
  };

  // Collaboration Details Handlers
  const handleCollabInputChange = (field, value) => {
    setNewCollaboration(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCollaboration = () => {
    if (!newCollaboration.name) {
      alert("Collaboration Name is required");
      return;
    }
    
    const newCollab = { ...newCollaboration, id: crypto.randomUUID() };
    setCollaborationDetails(prev => [...prev, newCollab]);
    setNewCollaboration({ name: "", country: "", type: "" });
  };

  const handleEditCollaboration = (id) => {
    const collabToEdit = collaborationDetails.find(collab => collab.id === id);
    if (collabToEdit) {
      setNewCollaboration({ ...collabToEdit });
      setEditingCollabId(id);
    }
  };

  const handleUpdateCollaboration = () => {
    if (!newCollaboration.name) {
      alert("Collaboration Name is required");
      return;
    }
    
    setCollaborationDetails(prev => 
      prev.map(collab => collab.id === editingCollabId ? { ...newCollaboration, id: editingCollabId } : collab)
    );
    setNewCollaboration({ name: "", country: "", type: "" });
    setEditingCollabId(null);
  };

  const handleRemoveCollaboration = (id) => {
    setCollaborationDetails(prev => prev.filter(collab => collab.id !== id));
    if (editingCollabId === id) {
      setEditingCollabId(null);
      setNewCollaboration({ name: "", country: "", type: "" });
    }
  };

  // Standard Details Handlers
  const handleStandardInputChange = (field, value) => {
    setNewStandard(prev => ({ ...prev, [field]: value }));
  };

  const handleAddStandard = () => {
    if (!newStandard.standard) {
      alert("Standard name is required");
      return;
    }
    
    const newStd = { ...newStandard, id: crypto.randomUUID() };
    setStandardDetails(prev => [...prev, newStd]);
    setNewStandard({ standard: "", institute: "", remark: "", date: "" });
  };

  const handleEditStandard = (id) => {
    const stdToEdit = standardDetails.find(std => std.id === id);
    if (stdToEdit) {
      setNewStandard({ ...stdToEdit });
      setEditingStandardId(id);
    }
  };

  const handleUpdateStandard = () => {
    if (!newStandard.standard) {
      alert("Standard name is required");
      return;
    }
    
    setStandardDetails(prev => 
      prev.map(std => std.id === editingStandardId ? { ...newStandard, id: editingStandardId } : std)
    );
    setNewStandard({ standard: "", institute: "", remark: "", date: "" });
    setEditingStandardId(null);
  };

  const handleRemoveStandard = (id) => {
    setStandardDetails(prev => prev.filter(std => std.id !== id));
    if (editingStandardId === id) {
      setEditingStandardId(null);
      setNewStandard({ standard: "", institute: "", remark: "", date: "" });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    if (!currentUser?.id) {
      setError("User not authenticated.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("user", currentUser.id);
    formData.append("companyName", companyName);
    formData.append("description", description);
    formData.append("website", website);
    formData.append("address", address);
    formData.append("city", city);
    formData.append("state", state);
    formData.append("pincode", pincode);
    formData.append("country", country);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("foundedYear", String(foundedYear));
    formData.append("employeeCount", employeeCount);
    formData.append("annualTurnover", annualTurnover);
    formData.append("companyType", companyType);

    // Set approval status to pending on every submission
    formData.append("approvalStatus", "pending");

    // Handle company logo
    if (companyLogo instanceof File) {
      formData.append("companyLogo", companyLogo);
    } else if (companyLogo === null && companyLogoUrl === null) {
      // If logo was removed, send empty string to clear it in PocketBase
      formData.append("companyLogo", "");
    }

    // Stringify JSON fields and remove temporary 'id'
    formData.append(
      "jvDetails",
      JSON.stringify(jvDetails.map(({ id, ...rest }) => rest))
    );
    formData.append(
      "collaborationDetails",
      JSON.stringify(collaborationDetails.map(({ id, ...rest }) => rest))
    );
    formData.append(
      "standardDetails",
      JSON.stringify(standardDetails.map(({ id, ...rest }) => rest))
    );

    try {
      if (companyId) {
        await pb.collection("companies").update(companyId, formData);
        setMessage("Company details updated successfully! Awaiting admin approval.");
      } else {
        const newRecord = await pb.collection("companies").create(formData);
        setMessage("Company details added successfully! Awaiting admin approval.");
        setCompanyId(newRecord.id);
      }
      setIsError(false);
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
    } catch (err) {
      console.error("Company form submission failed:", err);
      setError(err.message || "Failed to save company details.");
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{companyId ? "Edit Company Details" : "Add Company Details"}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {message && <p className={`text-center mb-4 ${isError ? "text-red-500" : "text-green-500"}`}>{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Company Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full">
              <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
            </div>
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
              <Input id="companyLogo" type="file" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} />
              {companyLogoUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={companyLogoUrl || "/placeholder.svg"} alt="Company Logo Preview" className="h-16 w-16 object-contain" />
                  <Button type="button" variant="ghost" size="icon" onClick={handleRemoveLogo} disabled={isSubmitting}>
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

          {/* JV Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">JV Details</h3>
            
            {/* Input Form for JV Details */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border p-4 rounded-md">
              <div>
                <Label htmlFor="jv-name">Name*</Label>
                <Input 
                  id="jv-name" 
                  value={newJvDetail.name} 
                  onChange={(e) => handleJvInputChange('name', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="jv-country">Country</Label>
                <Input 
                  id="jv-country" 
                  value={newJvDetail.country} 
                  onChange={(e) => handleJvInputChange('country', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="jv-products">Products</Label>
                <Input 
                  id="jv-products" 
                  value={newJvDetail.products} 
                  onChange={(e) => handleJvInputChange('products', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="jv-type">Type</Label>
                <Input 
                  id="jv-type" 
                  value={newJvDetail.type} 
                  onChange={(e) => handleJvInputChange('type', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="jv-holding">Holding (%)</Label>
                <Input 
                  id="jv-holding" 
                  type="number" 
                  value={newJvDetail.holding} 
                  onChange={(e) => handleJvInputChange('holding', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="md:col-span-5 flex justify-end mt-2">
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
              <div className="border rounded-md overflow-hidden">
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
                      <TableRow key={jv.id}>
                        <TableCell>{jv.name}</TableCell>
                        <TableCell>{jv.country}</TableCell>
                        <TableCell>{jv.products}</TableCell>
                        <TableCell>{jv.type}</TableCell>
                        <TableCell>{jv.holding}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditJvDetail(jv.id)}
                              disabled={isSubmitting}
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
              <p className="text-sm text-muted-foreground">No JV details added yet.</p>
            )}
          </div>

          {/* Collaboration Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Collaboration Details</h3>
            
            {/* Input Form for Collaboration Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end border p-4 rounded-md">
              <div>
                <Label htmlFor="collab-name">Name*</Label>
                <Input 
                  id="collab-name" 
                  value={newCollaboration.name} 
                  onChange={(e) => handleCollabInputChange('name', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="collab-country">Country</Label>
                <Input 
                  id="collab-country" 
                  value={newCollaboration.country} 
                  onChange={(e) => handleCollabInputChange('country', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="collab-type">Type</Label>
                <Input 
                  id="collab-type" 
                  value={newCollaboration.type} 
                  onChange={(e) => handleCollabInputChange('type', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="md:col-span-3 flex justify-end mt-2">
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
              <div className="border rounded-md overflow-hidden">
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
                      <TableRow key={collab.id}>
                        <TableCell>{collab.name}</TableCell>
                        <TableCell>{collab.country}</TableCell>
                        <TableCell>{collab.type}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditCollaboration(collab.id)}
                              disabled={isSubmitting}
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
              <p className="text-sm text-muted-foreground">No collaboration details added yet.</p>
            )}
          </div>

          {/* Standard Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Standard Details</h3>
            
            {/* Input Form for Standard Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end border p-4 rounded-md">
              <div>
                <Label htmlFor="std-standard">Standard*</Label>
                <Input 
                  id="std-standard" 
                  value={newStandard.standard} 
                  onChange={(e) => handleStandardInputChange('standard', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="std-institute">Institute</Label>
                <Input 
                  id="std-institute" 
                  value={newStandard.institute} 
                  onChange={(e) => handleStandardInputChange('institute', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="std-remark">Remark</Label>
                <Input 
                  id="std-remark" 
                  value={newStandard.remark} 
                  onChange={(e) => handleStandardInputChange('remark', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="std-date">Date</Label>
                <Input 
                  id="std-date" 
                  type="date" 
                  value={newStandard.date} 
                  onChange={(e) => handleStandardInputChange('date', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="md:col-span-4 flex justify-end mt-2">
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
              <div className="border rounded-md overflow-hidden">
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
                      <TableRow key={std.id}>
                        <TableCell>{std.standard}</TableCell>
                        <TableCell>{std.institute}</TableCell>
                        <TableCell>{std.remark}</TableCell>
                        <TableCell>{std.date}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditStandard(std.id)}
                              disabled={isSubmitting}
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
              <p className="text-sm text-muted-foreground">No standard details added yet.</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
              {isSubmitting ? "Saving..." : (companyId ? "Update Company" : "Add Company")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
