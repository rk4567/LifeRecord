import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

const AdminAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (roles?.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          toast.error("Unauthorized access");
          await supabase.auth.signOut();
        }
      }
    };
    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (roles?.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          toast.error("Unauthorized access");
          await supabase.auth.signOut();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = loginSchema.parse(formData);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password
      });

      if (authError) throw authError;

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .single();

      if (roleError || roleData?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Unauthorized: Admin access only");
      }

      toast.success("Admin login successful!");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Official Portal</h1>
          <p className="text-muted-foreground">Government officials only</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Official Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@registry.gov"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login as Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="link" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
