import { useEffect, useState } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Settings, Building2, DollarSign, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";

type SettingsForm = {
  companyName: string;
  companyAddress: string;
  currencySymbol: string;
  lowStockThreshold: string;
  loyaltyDiscountThreshold: string;
  loyaltyDiscountPercentage: string;
};

const defaultForm: SettingsForm = {
  companyName: "",
  companyAddress: "",
  currencySymbol: "$",
  lowStockThreshold: "10",
  loyaltyDiscountThreshold: "5000",
  loyaltyDiscountPercentage: "10",
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const updateMut = useUpdateSettings();
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      setForm({
        companyName: s.companyName ?? "",
        companyAddress: s.companyAddress ?? "",
        currencySymbol: s.currencySymbol ?? "$",
        lowStockThreshold: String(s.lowStockThreshold ?? 10),
        loyaltyDiscountThreshold: String(s.loyaltyDiscountThreshold ?? 5000),
        loyaltyDiscountPercentage: String(s.loyaltyDiscountPercentage ?? 10),
      });
      setDirty(false);
    }
  }, [settings]);

  function handleChange(key: keyof SettingsForm, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true);
  }

  async function handleSave() {
    try {
      await updateMut.mutateAsync({
        data: {
          companyName: form.companyName,
          companyAddress: form.companyAddress || undefined,
          currencySymbol: form.currencySymbol,
          lowStockThreshold: parseInt(form.lowStockThreshold),
          loyaltyDiscountThreshold: parseFloat(form.loyaltyDiscountThreshold),
          loyaltyDiscountPercentage: parseFloat(form.loyaltyDiscountPercentage),
        },
      });
      toast.success("Settings saved successfully");
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["/v1/settings"] });
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to save settings");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm">Configure your AutoParts Admin Portal</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!dirty || updateMut.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMut.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Company Name</Label>
              <Input value={form.companyName} onChange={e => handleChange("companyName", e.target.value)} placeholder="Your company name" />
            </div>
            <div className="space-y-1">
              <Label>Company Address</Label>
              <Input value={form.companyAddress} onChange={e => handleChange("companyAddress", e.target.value)} placeholder="Full company address" />
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Currency Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Currency Symbol</Label>
              <Input value={form.currencySymbol} onChange={e => handleChange("currencySymbol", e.target.value)} placeholder="$" maxLength={3} className="w-24" />
              <p className="text-xs text-muted-foreground">Used for displaying prices throughout the portal</p>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Low Stock Threshold</Label>
              <Input type="number" min="0" value={form.lowStockThreshold} onChange={e => handleChange("lowStockThreshold", e.target.value)} className="w-32" />
              <p className="text-xs text-muted-foreground">Alert when any part's stock falls at or below this number</p>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty / Discount Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Loyalty Discount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Discount Threshold ($)</Label>
              <Input type="number" min="0" step="100" value={form.loyaltyDiscountThreshold} onChange={e => handleChange("loyaltyDiscountThreshold", e.target.value)} className="w-40" />
              <p className="text-xs text-muted-foreground">Minimum purchase amount to trigger loyalty discount</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <Label>Discount Percentage (%)</Label>
              <Input type="number" min="0" max="100" step="0.5" value={form.loyaltyDiscountPercentage} onChange={e => handleChange("loyaltyDiscountPercentage", e.target.value)} className="w-32" />
              <p className="text-xs text-muted-foreground">Discount applied to customers above the threshold</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {dirty && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="shadow-lg border-primary">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <span className="text-sm font-medium">You have unsaved changes</span>
              <Button size="sm" onClick={handleSave} disabled={updateMut.isPending} className="bg-primary text-primary-foreground">
                <Save className="h-3 w-3 mr-1" /> Save
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
