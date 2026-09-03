import cds from '@sap/cds'
import { canTransition } from './booking-status'

const { SELECT, UPDATE } = cds.ql

/** e.g. 205/55 R16 winter */
const TIRE_SPEC = /^\d{3}\/\d{2} R\d{2} (winter|summer|allseason)$/
/** e.g. GAR-01 */
const GARAGE_ID = /^GAR-\d{2}$/

type TireDelivered = {
  bookingId?: string
  garageId?: string
}

export default class BookingService extends cds.ApplicationService {
  async init() {
    const { Bookings } = this.entities

    const messaging = await cds.connect.to('messaging')

    this.before('CREATE', Bookings, (req) => {
      const tireSpec = req.data.tireSpec?.trim()
      const garageId = req.data.garageId?.trim()

      if (!TIRE_SPEC.test(tireSpec ?? '')) {
        req.reject(400, 'tireSpec must look like "205/55 R16 winter" (winter, summer or allseason)')
      }
      if (!GARAGE_ID.test(garageId ?? '')) {
        req.reject(400, 'garageId must look like "GAR-01"')
      }

      req.data.tireSpec = tireSpec
      req.data.garageId = garageId
    })

    this.after('CREATE', Bookings, async (_keys, req) => {
      const { ID, tireSpec, garageId } = req.data
      await messaging.emit('BookingCreated', { bookingId: ID, tireSpec, garageId })
    })

    messaging.on('TireDelivered', async (msg) => {
      const { bookingId } = msg.data as TireDelivered
      if (!bookingId) {
        console.warn('TireDelivered without a bookingId, ignoring')
        return
      }

      const booking = await SELECT.one.from(Bookings, bookingId)
      if (!booking) {
        console.warn(`TireDelivered for unknown booking ${bookingId}, ignoring`)
        return
      }
      if (!canTransition(booking.status, 'ReadyForSwap')) {
        console.warn(`TireDelivered for booking ${bookingId} in status ${booking.status}, ignoring`)
        return
      }

      await UPDATE.entity(Bookings, bookingId).with({ status: 'ReadyForSwap' })
    })

    this.on('confirmSwap', Bookings, async (req) => {
      const booking = await SELECT.one.from(req.subject)
      if (!booking) return req.reject(404, 'booking not found')
      if (!canTransition(booking.status, 'Done')) {
        return req.reject(409, `a booking in status ${booking.status} cannot be swapped`)
      }

      await UPDATE.entity(Bookings, booking.ID).with({ status: 'Done' })
      return SELECT.one.from(req.subject)
    })

    return super.init()
  }
}
