import { addMonths, format } from 'date-fns'

export const INSTALLMENT_MONTH_OPTIONS = Array.from(
  { length: 12 },
  (_, i) => i + 1,
)

// ! 할부 금액 분할
export function splitInstallmentAmount(
  totalAmount: number,
  months: number,
): number[] {
  if (months <= 1) return [totalAmount]

  const baseAmount = Math.floor(totalAmount / months)
  const remainder = totalAmount - baseAmount * months

  return Array.from({ length: months }, (_, index) =>
    index === months - 1 ? baseAmount + remainder : baseAmount,
  )
}

// ! 할부 날짜 조회
export function getInstallmentDates(startDate: Date, months: number): string[] {
  return Array.from({ length: months }, (_, index) =>
    format(addMonths(startDate, index), 'yyyy-MM-dd'),
  )
}
