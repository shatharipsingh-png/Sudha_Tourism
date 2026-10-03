import { EnquiryForm, type EnquiryFormPackageOption } from "@/components/shared/enquiry-form";

/**
 * "Book Now" flows through the same enquiry pipeline as "Enquire Now" — there is
 * no online payment/booking model, so a booking request is captured as an
 * Enquiry with an explicit booking intent for the admin team to action.
 */
export function BookingForm({
  packages = [],
  defaultPackageId,
}: {
  packages?: EnquiryFormPackageOption[];
  defaultPackageId?: string;
}) {
  return (
    <EnquiryForm packages={packages} defaultPackageId={defaultPackageId} intent="book" />
  );
}
