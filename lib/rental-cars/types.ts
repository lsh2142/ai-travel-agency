export type CarCategory = 'compact' | 'sedan' | 'suv' | 'minivan' | 'luxury'
export type TransmissionType = 'auto' | 'manual'

export interface RentalCarResult {
  id: string
  vendor: string          // 렌터카 업체명 (예: Times, Orix, Budget)
  vendorLogoText: string  // 업체 이니셜 or 약칭 (로고 대용)
  carName: string         // 차량 모델명 (예: Toyota Aqua, Honda Fit)
  category: CarCategory
  transmission: TransmissionType
  seats: number
  pricePerDay: number     // KRW 기준
  totalPrice: number      // 전체 기간 합산 (pricePerDay × days)
  currency: 'KRW'
  pickupLocation: string  // 예: "나하 공항"
  features: string[]      // 예: ['GPS', '보험 포함', 'ETC 카드']
  bookingUrl: string
  rating?: number         // 1~5
  reviewCount?: number
}

export interface RentalCarSearchParams {
  destination: string
  pickupDate: string   // YYYY-MM-DD
  returnDate: string   // YYYY-MM-DD
  passengers?: number
}
