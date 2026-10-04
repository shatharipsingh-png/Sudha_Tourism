import { MessageCircle } from "lucide-react";
import { site } from "../../config/site";
import { whatsappUrl } from "../../utils/forms";
import styles from "./Layout.module.css";
export default function WhatsAppButton() {
  const url = whatsappUrl(site.whatsapp, site.businessName);
  return url ? (
    <a
      className={styles.whatsapp}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Enquire on WhatsApp"
    >
      <MessageCircle aria-hidden="true" />
    </a>
  ) : null;
}
