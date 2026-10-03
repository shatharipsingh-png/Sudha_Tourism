"use client";

import * as React from "react";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterForm({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.alreadySubscribed) {
        toast.info("You're already subscribed.");
      } else {
        toast.success("Subscribed! Watch your inbox for travel inspiration.");
      }
      setEmail("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isDark = variant === "dark";

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm gap-2">
      <div className="relative flex-1">
        <Mail
          className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-navy-400" : "text-muted-foreground"}`}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className={
            isDark
              ? "h-11 w-full rounded-full border border-navy-700 bg-navy-800 pl-9 pr-4 text-sm text-white placeholder:text-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              : "h-11 w-full rounded-full border border-border bg-white pl-9 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          }
        />
      </div>
      <Button type="submit" size="default" disabled={loading} className="shrink-0">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
      </Button>
    </form>
  );
}
