import { useState, useEffect } from "react";
import { 
  useGetCurrentCustomer, 
  useGetLoyaltyStatus,
  useUpdateCurrentCustomer,
  useUpdateNotificationSettings,
  getGetCurrentCustomerQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Bell, Award, Save, Camera, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";

export default function ProfilePage() {
  const { data: customer, isLoading: loadingCustomer } = useGetCurrentCustomer();
  const { data: loyalty, isLoading: loadingLoyalty } = useGetLoyaltyStatus();
  
  const updateCustomer = useUpdateCurrentCustomer();
  const updateSettings = useUpdateNotificationSettings();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    dob: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [notifications, setNotifications] = useState({
    emailInvoices: true,
    appointmentReminders: true,
    aiAlerts: true,
    promotionalOffers: false,
    overdueReminders: true
  });

  // Sync form state when data loads
  useEffect(() => {
    if (customer) {
      setProfileForm({
        fullName: customer.fullName || "",
        phone: customer.phone || "",
        address: customer.address || "",
        dob: customer.dob || ""
      });
      setNotifications(customer.notificationSettings);
    }
  }, [customer]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomer.mutate(
      { data: profileForm },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentCustomerQueryKey() });
          toast({ title: "Profile updated successfully" });
        }
      }
    );
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    // Mock successful password change
    setTimeout(() => {
      toast({ title: "Password changed successfully" });
      setPasswordForm({ current: "", new: "", confirm: "" });
    }, 500);
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    const newSettings = { ...notifications, [key]: !notifications[key] };
    setNotifications(newSettings);
    
    updateSettings.mutate(
      { data: newSettings },
      {
        onSuccess: () => {
          toast({ title: "Preferences updated" });
          queryClient.invalidateQueries({ queryKey: getGetCurrentCustomerQueryKey() });
        }
      }
    );
  };

  if (loadingCustomer || !customer) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-6">
          <Skeleton className="w-1/4 h-64" />
          <Skeleton className="flex-1 h-96" />
        </div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'bronze': return 'bg-amber-700/20 text-amber-700 border-amber-700/30';
      case 'silver': return 'bg-slate-400/20 text-slate-600 border-slate-400/30';
      case 'gold': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'platinum': return 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile, preferences, and loyalty status.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Profile Card Sidebar */}
        <Card className="w-full md:w-80 shrink-0">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={customer.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">{customer.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button size="icon" variant="outline" className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-sm">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <h2 className="text-xl font-bold">{customer.fullName}</h2>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
            </div>
            
            <Badge variant="outline" className={getTierColor(loyalty?.tier || 'Bronze')}>
              {loyalty?.tier || 'Bronze'} Member
            </Badge>
            
            <div className="w-full pt-4 border-t mt-2 flex justify-between text-sm">
              <div className="flex flex-col items-center">
                <span className="font-semibold">{customer.loyaltyPoints}</span>
                <span className="text-muted-foreground text-xs">Points</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold">{formatDate(customer.createdAt)}</span>
                <span className="text-muted-foreground text-xs">Joined</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <div className="flex-1 w-full min-w-0">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 mb-4 border bg-muted/50">
              <TabsTrigger value="personal" className="flex items-center gap-2 py-2">
                <User className="h-4 w-4" /> Personal Info
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 py-2">
                <Shield className="h-4 w-4" /> Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 py-2">
                <Bell className="h-4 w-4" /> Notifications
              </TabsTrigger>
              <TabsTrigger value="loyalty" className="flex items-center gap-2 py-2">
                <Award className="h-4 w-4" /> Loyalty
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your contact details and address.</CardDescription>
                </CardHeader>
                <form onSubmit={handleProfileSubmit}>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input 
                          id="fullName" 
                          value={profileForm.fullName} 
                          onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={customer.email} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          value={profileForm.phone} 
                          onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input 
                          id="dob" 
                          type="date"
                          value={profileForm.dob ? profileForm.dob.split('T')[0] : ''} 
                          onChange={e => setProfileForm(p => ({ ...p, dob: e.target.value }))} 
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input 
                          id="address" 
                          value={profileForm.address} 
                          onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} 
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-6">
                    <Button type="submit" disabled={updateCustomer.isPending} className="gap-2">
                      <Save className="h-4 w-4" /> Save Changes
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Update your password to keep your account secure.</CardDescription>
                </CardHeader>
                <form onSubmit={handlePasswordSubmit}>
                  <CardContent className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="current">Current Password</Label>
                      <Input 
                        id="current" 
                        type="password" 
                        value={passwordForm.current}
                        onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new">New Password</Label>
                      <Input 
                        id="new" 
                        type="password" 
                        value={passwordForm.new}
                        onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirm New Password</Label>
                      <Input 
                        id="confirm" 
                        type="password" 
                        value={passwordForm.confirm}
                        onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-6">
                    <Button type="submit" className="gap-2">
                      <Shield className="h-4 w-4" /> Update Password
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Control how and when we communicate with you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm tracking-tight">Service & Appointments</h3>
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="appointmentReminders" className="flex flex-col space-y-1">
                        <span>Appointment Reminders</span>
                        <span className="font-normal text-sm text-muted-foreground">Receive reminders before your scheduled services.</span>
                      </Label>
                      <Switch 
                        id="appointmentReminders" 
                        checked={notifications.appointmentReminders}
                        onCheckedChange={() => handleNotificationToggle('appointmentReminders')}
                        disabled={updateSettings.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="aiAlerts" className="flex flex-col space-y-1">
                        <span>AI Predictive Alerts</span>
                        <span className="font-normal text-sm text-muted-foreground">Get notified when our AI detects a potential issue with your vehicles.</span>
                      </Label>
                      <Switch 
                        id="aiAlerts" 
                        checked={notifications.aiAlerts}
                        onCheckedChange={() => handleNotificationToggle('aiAlerts')}
                        disabled={updateSettings.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="overdueReminders" className="flex flex-col space-y-1">
                        <span>Overdue Reminders</span>
                        <span className="font-normal text-sm text-muted-foreground">Alerts for missed regular maintenance intervals.</span>
                      </Label>
                      <Switch 
                        id="overdueReminders" 
                        checked={notifications.overdueReminders}
                        onCheckedChange={() => handleNotificationToggle('overdueReminders')}
                        disabled={updateSettings.isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-6">
                    <h3 className="font-semibold text-sm tracking-tight">Orders & Promotions</h3>
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="emailInvoices" className="flex flex-col space-y-1">
                        <span>Email Invoices</span>
                        <span className="font-normal text-sm text-muted-foreground">Receive receipts and invoices via email for every purchase.</span>
                      </Label>
                      <Switch 
                        id="emailInvoices" 
                        checked={notifications.emailInvoices}
                        onCheckedChange={() => handleNotificationToggle('emailInvoices')}
                        disabled={updateSettings.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="promotionalOffers" className="flex flex-col space-y-1">
                        <span>Promotional Offers</span>
                        <span className="font-normal text-sm text-muted-foreground">Discounts, special offers, and new parts announcements.</span>
                      </Label>
                      <Switch 
                        id="promotionalOffers" 
                        checked={notifications.promotionalOffers}
                        onCheckedChange={() => handleNotificationToggle('promotionalOffers')}
                        disabled={updateSettings.isPending}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="loyalty" className="m-0">
              <Card className="overflow-hidden border-0 shadow-md">
                <div className="h-32 bg-gradient-to-r from-primary/80 to-primary flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                  <div className="text-primary-foreground text-center relative z-10">
                    <h2 className="text-3xl font-bold">{loyalty?.tier || 'Bronze'} Member</h2>
                    <p className="opacity-90">{customer.loyaltyPoints} Points</p>
                  </div>
                </div>
                
                <CardContent className="pt-8 space-y-8">
                  {loyalty?.nextTier && loyalty.nextTierThreshold ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Progress to {loyalty.nextTier}</span>
                        <span>{formatCurrency(loyalty.totalSpend)} / {formatCurrency(loyalty.nextTierThreshold)}</span>
                      </div>
                      <Progress value={loyalty.progressPercent} className="h-3 bg-muted" />
                      <p className="text-xs text-muted-foreground text-center">
                        Spend {formatCurrency(loyalty.nextTierThreshold - loyalty.totalSpend)} more to reach {loyalty.nextTier}.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-semibold">Maximum Tier Reached</h3>
                      <p className="text-sm text-muted-foreground mt-1">You're enjoying the highest level of benefits.</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Your Benefits</h3>
                    <ul className="space-y-3">
                      {loyalty?.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {loyalty?.recentDiscounts && loyalty.recentDiscounts.length > 0 && (
                    <div className="space-y-3 pt-6 border-t">
                      <h3 className="font-semibold text-sm text-muted-foreground">Recent Savings</h3>
                      <div className="grid gap-2">
                        {loyalty.recentDiscounts.map((discount, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-md text-sm">
                            <span className="font-medium">Order #{discount.orderId}</span>
                            <span className="text-green-600 font-semibold">Saved {formatCurrency(discount.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
