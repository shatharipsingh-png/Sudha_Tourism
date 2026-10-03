"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const clientEnquirySchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  packageId: z.string().optional(),
  travelDate: z.string().min(1, "Please pick a travel date"),
  adults: z.coerce.number().int().min(1),
  children: z.coerce.number().int().min(0),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof clientEnquirySchema>;

export type EnquiryFormPackageOption = { id: string; name: string };

export function EnquiryForm({
  packages = [],
  defaultPackageId,
  intent = "enquire",
}: {
  packages?: EnquiryFormPackageOption[];
  defaultPackageId?: string;
  intent?: "enquire" | "book";
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientEnquirySchema),
    defaultValues: {
      packageId: defaultPackageId ?? "",
      adults: 2,
      children: 0,
      message:
        intent === "book"
          ? "I would like to book this package. Please share the next steps and payment details."
          : "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "We couldn't submit your enquiry. Please try again.");
        return;
      }
      router.push(`/thank-you?ref=${data.referenceNo}`);
    } catch {
      toast.error("We couldn't submit your enquiry. Please try again.");
    }
  }

  const todayISO = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="enquiry-form">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="Your name" {...register("name")} />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" placeholder="+91 98765 43210" {...register("phone")} />
          {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {packages.length > 0 && (
        <div>
          <Label htmlFor="packageId">Package</Label>
          <Select id="packageId" {...register("packageId")}>
            <option value="">Not sure yet / general enquiry</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label htmlFor="travelDate">Travel Date</Label>
          <Input id="travelDate" type="date" min={todayISO} {...register("travelDate")} />
          {errors.travelDate && (
            <p className="mt-1 text-xs text-destructive">{errors.travelDate.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="adults">Adults</Label>
          <Input id="adults" type="number" min={1} {...register("adults")} />
        </div>
        <div>
          <Label htmlFor="children">Children</Label>
          <Input id="children" type="number" min={0} {...register("children")} />
        </div>
      </div>

      <div>
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea id="message" placeholder="Tell us about your travel plans..." {...register("message")} />
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {intent === "book" ? "Confirm Booking Request" : "Submit Enquiry"}
      </Button>
    </form>
  );
}
