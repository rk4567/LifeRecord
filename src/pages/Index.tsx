import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, FileText, Clock, Lock, Users, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">lifeDeathRecord</span>
            </div>
            <Button variant="outline" onClick={() => navigate("/admin-auth")}>
              Official Login
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6 py-20 md:py-28">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            <span>Trusted by Government Authorities</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            Birth and Death Registration
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Secure, simple, and in your control. Experience blockchain-level security for your vital records.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              className="text-base px-8 h-12 shadow-lg"
              onClick={() => navigate("/register")}
            >
              Register Birth/Death
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-base px-8 h-12"
              onClick={() => navigate("/auth")}
            >
              Citizen Login
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose lifeDeathRecord?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built with security, transparency, and citizen empowerment at its core
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="p-8 space-y-4 hover:shadow-xl transition-all border-border/50">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Blockchain-Level Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your records are protected with military-grade encryption and distributed storage technology.
              </p>
            </Card>

            <Card className="p-8 space-y-4 hover:shadow-xl transition-all border-border/50">
              <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileText className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Instant Digital Certificates</h3>
              <p className="text-muted-foreground leading-relaxed">
                Access and share your official documents anytime, anywhere—no more waiting in lines.
              </p>
            </Card>

            <Card className="p-8 space-y-4 hover:shadow-xl transition-all border-border/50">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Real-Time Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Monitor your application status in real-time from submission to approval.
              </p>
            </Card>

            <Card className="p-8 space-y-4 hover:shadow-xl transition-all border-border/50">
              <div className="h-14 w-14 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-success" />
              </div>
              <h3 className="text-xl font-semibold">Fraud Prevention</h3>
              <p className="text-muted-foreground leading-relaxed">
                Advanced verification systems eliminate duplicate records and fraudulent registrations.
              </p>
            </Card>

            <Card className="p-8 space-y-4 hover:shadow-xl transition-all border-border/50">
              <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Citizen Empowerment</h3>
              <p className="text-muted-foreground leading-relaxed">
                You own and control your data. Share only what you want, when you want.
              </p>
            </Card>

            <Card className="p-8 space-y-4 hover:shadow-xl transition-all border-border/50">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Government Verified</h3>
              <p className="text-muted-foreground leading-relaxed">
                All certificates are officially verified and recognized by government authorities.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground p-12 md:p-16 text-center max-w-4xl mx-auto shadow-2xl border-0">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg md:text-xl mb-8 opacity-95 max-w-2xl mx-auto">
              Join thousands of citizens who have already taken control of their civil records.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-base px-8 h-12 shadow-lg"
              onClick={() => navigate("/auth")}
            >
              Create Your Account
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p className="text-sm">© 2025 lifeDeathRecord. Empowering citizens with secure digital birth/death registration.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
