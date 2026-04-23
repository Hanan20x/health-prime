import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Camera, Loader2, Check, Trash2, X } from "lucide-react";
import { apiFetch } from "@/api/client";
import type { UserOut } from "@/api/types";
import { useLang } from "@/hooks/useLang";
import { tx, txRole } from "@/lib/i18n";
import { toast } from "sonner";

export default function MyProfilePage() {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);

  const { data: me, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<UserOut>("/auth/me"),
  });

  useEffect(() => {
    if (me) {
      setFullName(me.fullName);
      setAvatarUrl(me.avatarUrl);
    }
  }, [me]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserOut>) => 
      apiFetch<UserOut>("/auth/me", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success(tx("profileUpdated", lang));
    },
    onError: (error: any) => {
      toast.error(error.message || tx("failedUpdateProfile", lang));
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        setIsUploading(false);
        toast.info(tx("uploadPicture", lang));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      toast.error(tx("uploadPictureError", lang));
    }
    
    // Reset file input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(undefined);
    toast.info(tx("removePicture", lang));
  };

  const handleSave = () => {
    updateMutation.mutate({ 
      fullName: fullName.trim(), 
      avatarUrl: avatarUrl || null 
    });
  };

  const hasChanges = me && (fullName !== me.fullName || avatarUrl !== me.avatarUrl);
  const isRTL = lang === "ar";

  return (
    <DashboardLayout>
      <PageHeader 
        title={tx("profileTitle", lang)} 
        description={tx("profileDescription", lang)} 
      />

      <div className="w-full max-w-4xl space-y-6">
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {isLoading && (
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          
          {!isLoading && me && (
            <>
              <div className="p-8 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border-b border-border">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-background overflow-hidden flex items-center justify-center shadow-md transition-transform group-hover:scale-105 duration-300">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-primary" />
                      )}
                      
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute -bottom-2 -right-2 flex gap-1 items-center">
                      {avatarUrl && (
                        <button 
                          onClick={handleRemoveAvatar}
                          className="p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-all hover:scale-110 active:scale-95 border-2 border-background"
                          title={tx("removePicture", lang)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 border-2 border-background"
                        title={avatarUrl ? tx("changePicture", lang) : tx("uploadPicture", lang)}
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAvatarUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                  
                  <div className="text-center sm:text-start">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{me.fullName}</h2>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {txRole(me.role, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-semibold opacity-80">
                        {tx("fullName", lang)}
                      </Label>
                      <div className="relative">
                        <User className={`absolute top-3 ${isRTL ? "right-3" : "left-3"} w-4 h-4 text-muted-foreground`} />
                        <Input 
                          id="fullName"
                          value={fullName} 
                          onChange={(e) => setFullName(e.target.value)}
                          className={`${isRTL ? "pr-10" : "pl-10"} h-11 focus-visible:ring-primary/30 border-border/60 font-medium`}
                          placeholder={tx("fullName", lang)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold opacity-80">{tx("role", lang)}</Label>
                      <Input value={txRole(me.role, lang)} readOnly className="bg-muted/10 h-11 border-border/40 cursor-not-allowed text-muted-foreground font-medium" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold opacity-80">{tx("email", lang)}</Label>
                      <div className="relative">
                        <Mail className={`absolute top-3 ${isRTL ? "right-3" : "left-3"} w-4 h-4 text-muted-foreground`} />
                        <Input 
                          value={me.email} 
                          readOnly 
                          className={`${isRTL ? "pr-10" : "pl-10"} bg-muted/10 h-11 border-border/40 cursor-not-allowed text-muted-foreground font-medium`} 
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">{tx("quickActions", lang)}</h4>
                        <p className="text-xs text-muted-foreground">{tx("proIdentityDesc", lang)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-8 mt-8 border-t border-border">
                  {hasChanges && (
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setFullName(me.fullName);
                        setAvatarUrl(me.avatarUrl);
                      }}
                      disabled={updateMutation.isPending}
                    >
                      {tx("cancel", lang)}
                    </Button>
                  )}
                  <Button 
                    onClick={handleSave} 
                    disabled={updateMutation.isPending || !hasChanges || !fullName.trim()}
                    className="min-w-[160px] shadow-sm shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? "ml-2" : "mr-2"}`} />
                        {tx("loading", lang)}
                      </>
                    ) : (
                      <>
                        <Check className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {tx("updateProfile", lang)}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
