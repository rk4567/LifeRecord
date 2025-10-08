import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Shield, Plus, LogOut, FileText, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Registration {
  id: string;
  registration_type: "birth" | "death";
  status: "pending" | "under_review" | "approved" | "rejected";
  person_full_name: string;
  person_date_of_event: string;
  person_place_of_event: string;
  rejection_reason?: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkAuth();
    fetchRegistrations();

    // Set up realtime subscription
    const channel = supabase
      .channel("registration-changes")
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

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUserEmail(session.user.email || "");
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Citizen Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{userEmail}</span>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Registrations</h1>
            <p className="text-muted-foreground">Track and manage your birth and death certificates</p>
          </div>
          <Button onClick={() => navigate("/register")} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Registration
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : registrations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No registrations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by registering a birth or death certificate
                </p>
                <Button onClick={() => navigate("/register")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Registration
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {registrations.map((registration) => (
              <Card key={registration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
                        {registration.registration_type === "birth" ? "Birth" : "Death"} Certificate
                      </CardTitle>
                      <CardDescription>{registration.person_full_name}</CardDescription>
                    </div>
                    <StatusBadge status={registration.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(registration.person_date_of_event)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{registration.person_place_of_event}</span>
                    </div>
                  </div>

                  {registration.rejection_reason && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                      <p className="text-sm text-muted-foreground">{registration.rejection_reason}</p>
                    </div>
                  )}

                  {registration.status === "approved" && (
                    <div className="pt-3 border-t">
                      <Button className="w-full sm:w-auto">
                        <FileText className="h-4 w-4 mr-2" />
                        Download Certificate
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
