import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { loginCustomer, signUpCustomer, useAuthStatus } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const isAuthenticated = useAuthStatus();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      await loginCustomer({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      setLocation("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      setAuthError(message);
      toast({ title: "Sign in failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      await signUpCustomer({
        fullName: String(form.get("fullName") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      setLocation("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create account.";
      setAuthError(message);
      toast({ title: "Registration failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full lg:grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-muted h-full w-full">
        <div className="absolute inset-0 bg-zinc-900/40 z-10" />
        <img
          src="/images/auth-hero.png"
          alt="Automotive Workshop"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-20 h-full flex flex-col justify-end p-12 text-white">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-primary rounded-lg">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">AutoParts</span>
          </div>
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed max-w-lg">
              "The most reliable source for genuine parts and professional servicing. 
              Manage your vehicles with precision and confidence."
            </p>
          </blockquote>
        </div>
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 h-full bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px]"
        >
          <div className="flex flex-col space-y-2 text-center mb-8 lg:hidden">
            <Wrench className="h-8 w-8 mx-auto text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">AutoParts</h1>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0">
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your workshop dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-0">
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {authError ? <p className="text-sm text-destructive">{authError}</p> : null}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="name@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                      </div>
                      <Input id="password" name="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0">
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Register to manage your vehicles and book appointments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-0">
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {authError ? <p className="text-sm text-destructive">{authError}</p> : null}
                    <div className="space-y-2">
                      <Label htmlFor="r-name">Full Name</Label>
                      <Input id="r-name" name="fullName" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="r-email">Email</Label>
                      <Input id="r-email" name="email" type="email" placeholder="name@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="r-phone">Phone</Label>
                      <Input id="r-phone" name="phone" type="tel" placeholder="+1 555 000 0000" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="r-password">Password</Label>
                      <Input id="r-password" name="password" type="password" minLength={8} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
