import { z } from "zod";

function luhnValid(digits: string) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export const DEMO_CARD_NUMBER = "4242 4242 4242 4242";

export const paymentSchema = z
  .object({
    cardholderName: z.string().trim().min(1, "Name on card is required.").max(100, "Name is too long."),
    cardNumber: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length >= 13 && v.length <= 19, {
        message: "Card number must be 13-19 digits.",
      })
      .refine(luhnValid, {
        message: `That card number doesn't look valid. For this demo, try ${DEMO_CARD_NUMBER}.`,
      }),
    // Strict MM/YY: month 01-12, exactly two digits each side. The previous
    // regex (\d{2}\/\d{2}) accepted an out-of-range month like "13" or "00"
    // and only caught it in a separate runtime check — consolidated here.
    expiry: z
      .string()
      .trim()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry must be in MM/YY format, e.g. 12/29."),
    cvv: z.string().trim().regex(/^\d{3,4}$/, "Security code must be 3 or 4 digits."),
  })
  .superRefine((data, ctx) => {
    const [mm, yy] = data.expiry.split("/");
    const expiryEndOfMonth = new Date(2000 + Number(yy), Number(mm), 0);
    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0, 0, 0, 0);
    if (expiryEndOfMonth < startOfThisMonth) {
      ctx.addIssue({ code: "custom", path: ["expiry"], message: "This card has expired." });
    }
  });
export type PaymentInput = z.infer<typeof paymentSchema>;
