import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { ShieldCheck, LogOut, Search, CheckCircle, XCircle, Calendar, MapPin, User } from "lucide-react";
import { toast } from "sonner";

interface Registration {
  id: string;
  user_id: string;
  registration_type: "birth" | "death";
  status: "pending" | "under_review" | "approved" | "rejected";
  person_full_name: string;
  person_date_of_event: string;
  person_place_of_event: string;
  person_gender?: string | null;
  parent_guardian_name?: string | null;
  parent_guardian_id?: string | null;
  hospital_facility?: string | null;
  doctor_name?: string | null;
  additional_notes?: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    checkAdmin();
    fetchRegistrations();

    // Set up realtime subscription
    const channel = supabase
      .channel("admin-registration-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "registrations"
        },
        () => {
          fetchRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin-auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roles?.role !== "admin") {
      toast.error("Unauthorized access");
      await supabase.auth.signOut();
      navigate("/admin-auth");
    } else {
      setAdminEmail(session.user.email || "");
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("registrations")
        .update({
          status: "approved",
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Registration approved!");
      setSelectedRegistration(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to approve registration");
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("registrations")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Registration rejected");
      setSelectedRegistration(null);
      setRejectionReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject registration");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const filteredRegistrations = registrations.filter((reg) =>
    reg.person_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.person_place_of_event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = registrations.filter(r => r.status === "pending" || r.status === "under_review").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{adminEmail}</span>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Registration Management</h1>
          <p className="text-muted-foreground">Review and process citizen registrations</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">
                {registrations.filter(r => r.status === "approved").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{registrations.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRegistrations.map((registration) => (
              <Card
                key={registration.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedRegistration(registration)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {registration.registration_type === "birth" ? "Birth" : "Death"} Certificate
                      </CardTitle>
                      <CardDescription className="font-medium">
                        {registration.person_full_name}
                      </CardDescription>
                    </div>
                    <StatusBadge status={registration.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(registration.person_date_of_event)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{registration.person_place_of_event}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Submitted</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Review the information and take action
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium capitalize">{selectedRegistration.registration_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedRegistration.status} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{selectedRegistration.person_full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gender</Label>
                  <p className="font-medium capitalize">{selectedRegistration.person_gender || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{formatDate(selectedRegistration.person_date_of_event)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Place</Label>
                  <p className="font-medium">{selectedRegistration.person_place_of_event}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Parent/Guardian</Label>
                  <p className="font-medium">{selectedRegistration.parent_guardian_name || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">National ID</Label>
                  <p className="font-medium">{selectedRegistration.parent_guardian_id || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hospital/Facility</Label>
                  <p className="font-medium">{selectedRegistration.hospital_facility || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Doctor</Label>
                  <p className="font-medium">{selectedRegistration.doctor_name || "Not provided"}</p>
                </div>
              </div>

              {selectedRegistration.additional_notes && (
                <div>
                  <Label className="text-muted-foreground">Additional Notes</Label>
                  <p className="mt-1 text-sm">{selectedRegistration.additional_notes}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-muted-foreground">Submitted</Label>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedRegistration.created_at)}
                </p>
              </div>

              {selectedRegistration.status === "pending" || selectedRegistration.status === "under_review" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Provide a clear reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleReject(selectedRegistration.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="flex-1 bg-success hover:bg-success/90"
                      onClick={() => handleApprove(selectedRegistration.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    This registration has already been processed
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
