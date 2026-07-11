export type IntentAction = "reserve" | "spend" | "cancel";

export interface ExpenseIntent {
  action: IntentAction;
  amount: number;
  currency: "USDt";
  label: string;
  category: string;
  deadline: string | null;
}
