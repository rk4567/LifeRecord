import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const registrationSchema = z.object({
  registrationType: z.enum(["birth", "death"]),
  personFullName: z.string().min(2, "Full name is required"),
  personDateOfEvent: z.string().min(1, "Date is required"),
  personPlaceOfEvent: z.string().min(2, "Place is required"),
  personGender: z.string().optional(),
  parentGuardianName: z.string().optional(),
  parentGuardianId: z.string().optional(),
  hospitalFacility: z.string().optional(),
  doctorName: z.string().optional(),
  additionalNotes: z.string().optional()
});

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    registrationType: "birth",
    personFullName: "",
    personDateOfEvent: "",
    personPlaceOfEvent: "",
    personGender: "",
    parentGuardianName: "",
    parentGuardianId: "",
    hospitalFacility: "",
    doctorName: "",
    additionalNotes: ""
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = registrationSchema.parse(formData);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase.from("registrations").insert({
        user_id: session.user.id,
        registration_type: validated.registrationType,
        person_full_name: validated.personFullName,
        person_date_of_event: validated.personDateOfEvent,
        person_place_of_event: validated.personPlaceOfEvent,
        person_gender: validated.personGender || null,
        parent_guardian_name: validated.parentGuardianName || null,
        parent_guardian_id: validated.parentGuardianId || null,
        hospital_facility: validated.hospitalFacility || null,
        doctor_name: validated.doctorName || null,
        additional_notes: validated.additionalNotes || null
      });

      if (error) throw error;

      toast.success("Registration submitted successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to submit registration");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">New Registration</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Register Birth or Death Certificate</CardTitle>
            <CardDescription>
              Fill in the details below. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="registrationType">Registration Type *</Label>
                <Select
                  value={formData.registrationType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, registrationType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birth">Birth Certificate</SelectItem>
                    <SelectItem value="death">Death Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personFullName">Full Name *</Label>
                <Input
                  id="personFullName"
                  placeholder="Enter full name"
                  value={formData.personFullName}
                  onChange={(e) =>
                    setFormData({ ...formData, personFullName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="personDateOfEvent">
                    Date of {formData.registrationType === "birth" ? "Birth" : "Death"} *
                  </Label>
                  <Input
                    id="personDateOfEvent"
                    type="date"
                    value={formData.personDateOfEvent}
                    onChange={(e) =>
                      setFormData({ ...formData, personDateOfEvent: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personGender">Gender</Label>
                  <Select
                    value={formData.personGender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, personGender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personPlaceOfEvent">
                  Place of {formData.registrationType === "birth" ? "Birth" : "Death"} *
                </Label>
                <Input
                  id="personPlaceOfEvent"
                  placeholder="City, State/Region"
                  value={formData.personPlaceOfEvent}
                  onChange={(e) =>
                    setFormData({ ...formData, personPlaceOfEvent: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentGuardianName">
                  {formData.registrationType === "birth" ? "Parent" : "Next of Kin"} Name
                </Label>
                <Input
                  id="parentGuardianName"
                  placeholder="Enter name"
                  value={formData.parentGuardianName}
                  onChange={(e) =>
                    setFormData({ ...formData, parentGuardianName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentGuardianId">National ID</Label>
                <Input
                  id="parentGuardianId"
                  placeholder="Enter ID number"
                  value={formData.parentGuardianId}
                  onChange={(e) =>
                    setFormData({ ...formData, parentGuardianId: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hospitalFacility">Hospital/Facility</Label>
                  <Input
                    id="hospitalFacility"
                    placeholder="Facility name"
                    value={formData.hospitalFacility}
                    onChange={(e) =>
                      setFormData({ ...formData, hospitalFacility: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctorName">Doctor Name</Label>
                  <Input
                    id="doctorName"
                    placeholder="Dr. Name"
                    value={formData.doctorName}
                    onChange={(e) =>
                      setFormData({ ...formData, doctorName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any additional information..."
                  value={formData.additionalNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, additionalNotes: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Supporting Documents</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hospital records, ID copies, etc. (Max 10MB)
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Register;
