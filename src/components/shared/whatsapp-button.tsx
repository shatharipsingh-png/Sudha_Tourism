"use client";

import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buildWhatsAppLink } from "@/lib/utils";

export function WhatsAppButton() {
  const href = buildWhatsAppLink(
    siteConfig.contact.whatsapp,
    "Hi, I'm interested in planning a North India trip with Sudha Tourism. Please share more details."
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-floating transition-transform hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" fill="white" />
    </a>
  );
}
