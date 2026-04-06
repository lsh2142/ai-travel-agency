/**
 * 항공편 가격 체커 — 등록된 알림의 현재 가격을 조회하고 목표 가격 이하일 경우 Telegram으로 알림
 */
import { getMockFlights } from '@/lib/mock/flights'
import { TelegramNotifier } from '@/lib/notify/telegram'
import type { FlightPriceAlert } from './types'

const notifier = new TelegramNotifier()

export interface CheckResult {
  alertId: string
  route: string
  currentPrice: number
  targetPrice: number
  triggered: boolean
  notified: boolean
  error?: string
}

export async function checkFlightAlert(alert: FlightPriceAlert): Promise<CheckResult> {
  const result: CheckResult = {
    alertId: alert.id,
    route: alert.route,
    currentPrice: 0,
    targetPrice: alert.targetPrice,
    triggered: false,
    notified: false,
  }

  try {
    // 현재 mock 가격 조회
    const flights = getMockFlights(alert.from, alert.to, alert.departureDate)
    if (flights.length === 0) {
      result.error = '항공편 데이터 없음'
      return result
    }

    // 최저가 조회
    const minPrice = Math.min(...flights.map((f) => f.price))
    result.currentPrice = minPrice

    // 목표 가격 이하인지 확인
    if (minPrice <= alert.targetPrice) {
      result.triggered = true

      // Telegram 알림 발송
      const cheapestFlight = flights.find((f) => f.price === minPrice)!
      const message = buildAlertMessage(alert, cheapestFlight.price, cheapestFlight.airline, cheapestFlight.flightNumber)

      const notifyResult = await notifier.sendMessage({
        chatId: alert.telegramChatId,
        message,
        parseMode: 'HTML',
      })

      result.notified = notifyResult.success
      if (!notifyResult.success) {
        result.error = notifyResult.error
      }
    }
  } catch (e) {
    result.error = e instanceof Error ? e.message : '알 수 없는 오류'
  }

  return result
}

function buildAlertMessage(
  alert: FlightPriceAlert,
  price: number,
  airline: string,
  flightNumber: string
): string {
  const returnLine = alert.returnDate ? `\n📅 귀국일: ${alert.returnDate}` : ''
  return `✈️ <b>항공권 가격 알림!</b>

🛫 노선: <b>${alert.route}</b>
✈️ 항공편: ${airline} ${flightNumber}
📅 출발일: ${alert.departureDate}${returnLine}
💰 현재 최저가: <b>₩${price.toLocaleString('ko-KR')}</b>
🎯 목표 가격: ₩${alert.targetPrice.toLocaleString('ko-KR')}
📉 목표 가격 이하로 내려왔어요!

🔗 <a href="${alert.bookingUrl}">지금 예약하기</a>

⏰ 확인 시간: ${new Date().toLocaleString('ko-KR')}`
}
