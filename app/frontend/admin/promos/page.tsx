"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus, Edit3, Trash2, FileDown, Loader2, Tag, Calendar, Percent, Settings, X
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { ENDPOINTS } from "@/lib/endpoints";

type Promo = {
  id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  value: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  minBookingAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminPromosPage() {
  const queryClient = useQueryClient();

  const { data: promos, isLoading } = useQuery({
    queryKey: ["admin-promos"],
    queryFn: async (): Promise<Promo[]> => {
      const res = await fetch(ENDPOINTS.promos.adminList, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load promos");
      const json = await res.json() as { data?: Promo[] };
      return json.data ?? [];
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [toast, setToast] = useState<{ title: string; desc: string; type: string } | null>(null);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [expiryDate, setExpiryDate] = useState(() =>
    new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0]
  );
  const [usageLimit, setUsageLimit] = useState("100");
  const [minBookingAmount, setMinBookingAmount] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [gCount, setGCount] = useState("5");
  const [gPrefix, setGPrefix] = useState("PSW");
  const [gLength, setGLength] = useState("8");
  const [gDiscountType, setGDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [gValue, setGValue] = useState("10");
  const [gExpiryDate, setGExpiryDate] = useState(() =>
    new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0]
  );
  const [gUsageLimit, setGUsageLimit] = useState("100");
  const [gMinBookingAmount, setGMinBookingAmount] = useState("0");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function showToast(title: string, desc: string, type = "default") {
    setToast({ title, desc, type });
  }

  function resetCreateForm() {
    setCode("");
    setDescription("");
    setDiscountType("percentage");
    setValue("");
    setUsageLimit("100");
    setMinBookingAmount("0");
    setIsActive(true);
    setEditingPromo(null);
  }

  async function handleCreateOrUpdate() {
    if (!code.trim()) { showToast("Error", "Code is required.", "destructive"); return; }
    if (!value || Number(value) <= 0) { showToast("Error", "Valid discount value is required.", "destructive"); return; }
    if (!expiryDate) { showToast("Error", "Expiry date is required.", "destructive"); return; }

    const body = {
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
      discountType,
      value: Number(value),
      expiryDate: new Date(expiryDate).toISOString(),
      usageLimit: Number(usageLimit) || 100,
      minBookingAmount: Number(minBookingAmount) || 0,
      isActive,
    };

    const url = editingPromo
      ? `${ENDPOINTS.promos.adminList}/${editingPromo.id}`
      : ENDPOINTS.promos.adminList;
    const method = editingPromo ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message ?? `Failed to ${editingPromo ? "update" : "create"} promo`);
      }

      showToast(editingPromo ? "Updated" : "Created", `Promo ${body.code} saved.`);
      resetCreateForm();
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
    } catch (e) {
      showToast("Error", e instanceof Error ? e.message : "Request failed", "destructive");
    }
  }

  function handleEdit(promo: Promo) {
    setEditingPromo(promo);
    setCode(promo.code);
    setDescription(promo.description ?? "");
    setDiscountType(promo.discountType);
    setValue(String(promo.value));
    setExpiryDate(promo.expiryDate ? new Date(promo.expiryDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setUsageLimit(String(promo.usageLimit));
    setMinBookingAmount(String(promo.minBookingAmount));
    setIsActive(promo.isActive);
    setCreateOpen(true);
  }

  async function handleDelete(promo: Promo) {
    if (!window.confirm(`Delete promo ${promo.code}?`)) return;

    try {
      const res = await fetch(`${ENDPOINTS.promos.adminList}/${promo.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to delete promo");

      showToast("Deleted", `Promo ${promo.code} deleted.`);
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
    } catch (e) {
      showToast("Error", e instanceof Error ? e.message : "Delete failed", "destructive");
    }
  }

  async function handleGenerate() {
    if (!gExpiryDate) { showToast("Error", "Expiry date required.", "destructive"); return; }
    if (!gValue || Number(gValue) <= 0) { showToast("Error", "Valid discount value required.", "destructive"); return; }

    try {
      const res = await fetch(ENDPOINTS.promos.adminGenerate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: Number(gCount) || 5,
          prefix: gPrefix.trim() || undefined,
          length: Number(gLength) || 8,
          discountType: gDiscountType,
          value: Number(gValue),
          expiryDate: new Date(gExpiryDate).toISOString(),
          usageLimit: Number(gUsageLimit) || 100,
          minBookingAmount: Number(gMinBookingAmount) || 0,
        }),
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to generate promos");

      showToast("Generated", `${json.data?.length ?? 0} promo codes generated.`);
      setGenerateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
    } catch (e) {
      showToast("Error", e instanceof Error ? e.message : "Generation failed", "destructive");
    }
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Promo Codes</h1>
            <p className="text-muted-foreground">Manage discount codes for bookings.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => { resetCreateForm(); setGenerateOpen(true); }}>
              <FileDown className="h-4 w-4" /> Auto-Generate
            </Button>
            <Button className="gap-2" onClick={() => { resetCreateForm(); setCreateOpen(true); }}>
              <Plus className="h-4 w-4" /> Create Promo
            </Button>
          </div>
        </div>

        {toast && (
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "destructive" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
            <p className="font-medium text-sm">{toast.title}</p>
            <p className="text-xs opacity-90">{toast.desc}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (promos ?? []).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No promo codes yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(promos ?? []).map((promo) => (
              <Card key={promo.id} className="hover-elevate transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-mono">{promo.code}</CardTitle>
                    <Badge variant={promo.isActive ? "default" : "secondary"}>{promo.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                  {promo.description && <p className="text-sm text-muted-foreground mt-1">{promo.description}</p>}
                </CardHeader>
                <CardContent className="pt-0 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {promo.discountType === "percentage"
                      ? <><Percent className="h-3.5 w-3.5" /> {promo.value}% off{promo.minBookingAmount > 0 && ` (min ${formatCurrency(promo.minBookingAmount)})`}</>
                      : <><Settings className="h-3.5 w-3.5" /> {formatCurrency(promo.value)} off{promo.minBookingAmount > 0 && ` (min ${formatCurrency(promo.minBookingAmount)})`}</>
                    }
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> Expires: {new Date(promo.expiryDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    Used: {promo.usageCount} / {promo.usageLimit}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => handleEdit(promo)}>
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleDelete(promo)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {(createOpen || editingPromo) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingPromo ? "Edit Promo" : "Create Promo Code"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setCreateOpen(false); resetCreateForm(); }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1.5">Code</p>
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER10" className="font-mono" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1.5">Type</p>
                  <select className="w-full border rounded-md px-3 py-2 text-sm bg-background h-10" value={discountType} onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}>
                    <option value="percentage">Percentage %</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">Description</p>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Summer special offer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1.5">Discount Value</p>
                  <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={discountType === "percentage" ? "10" : "50"} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1.5">Usage Limit</p>
                  <Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1.5">Expiry Date</p>
                  <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1.5">Min. Booking Amount</p>
                  <Input type="number" value={minBookingAmount} onChange={(e) => setMinBookingAmount(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} id="active" />
                <label htmlFor="active" className="text-sm font-medium">Active</label>
              </div>
              <Button className="w-full" onClick={handleCreateOrUpdate}>
                {editingPromo ? "Save Changes" : "Create Promo"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {generateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Auto-Generate Promo Codes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setGenerateOpen(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1.5">Count</p>
                  <Input type="number" value={gCount} onChange={(e) => setGCount(e.target.value)} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1.5">Prefix</p>
                  <Input value={gPrefix} onChange={(e) => setGPrefix(e.target.value)} placeholder="PSW" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1.5">Code Length</p>
                  <Input type="number" value={gLength} onChange={(e) => setGLength(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1.5">Discount Type</p>
                  <select className="w-full border rounded-md px-3 py-2 text-sm bg-background h-10" value={gDiscountType} onChange={(e) => setGDiscountType(e.target.value as "percentage" | "fixed")}>
                    <option value="percentage">Percentage %</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1.5">Discount Value</p>
                  <Input type="number" value={gValue} onChange={(e) => setGValue(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1.5">Expiry Date</p>
                  <Input type="date" value={gExpiryDate} onChange={(e) => setGExpiryDate(e.target.value)} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1.5">Usage Limit</p>
                  <Input type="number" value={gUsageLimit} onChange={(e) => setGUsageLimit(e.target.value)} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1.5">Min. Booking Amount</p>
                  <Input type="number" value={gMinBookingAmount} onChange={(e) => setGMinBookingAmount(e.target.value)} />
                </div>
              </div>
              <Button className="w-full" onClick={handleGenerate}>
                Generate Promo Codes
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
