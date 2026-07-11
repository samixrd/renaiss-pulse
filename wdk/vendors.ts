export const VENDORS: Record<string, { address: string; label: string }> = {
  tickets: { address: process.env.SPEND_RECIPIENT ?? "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf", label: "Renaiss FC Ticket Office" },
  fees: { address: process.env.SPEND_RECIPIENT ?? "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf", label: "League Federation Account" },
  travel: { address: process.env.SPEND_RECIPIENT ?? "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf", label: "Travel Partner Agency" },
  merch: { address: process.env.SPEND_RECIPIENT ?? "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf", label: "Club Store" },
};

export function resolveVendor(category: string) {
  const cat = category.toLowerCase();
  return VENDORS[cat] ?? { address: process.env.SPEND_RECIPIENT ?? "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf", label: "External Vendor" };
}
