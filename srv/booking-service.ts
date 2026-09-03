import cds from '@sap/cds'

const { SELECT, UPDATE } = cds.ql

type TireDelivered = {
  bookingId?: string
  garageId?: string
}

export default class BookingService extends cds.ApplicationService {
  async init() {
    const { Bookings } = this.entities

    const messaging = await cds.connect.to('messaging')

    this.before('CREATE', Bookings, (req) => {
      if (!req.data.tireSpec?.trim()) req.reject(400, 'tireSpec must not be empty')
      if (!req.data.garageId?.trim()) req.reject(400, 'garageId must not be empty')
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
      if (booking.status !== 'Created') {
        console.warn(`TireDelivered for booking ${bookingId} in status ${booking.status}, ignoring`)
        return
      }

      await UPDATE.entity(Bookings, bookingId).with({ status: 'ReadyForSwap' })
    })

    this.on('confirmSwap', Bookings, async (req) => {
      const booking = await SELECT.one.from(req.subject)
      if (!booking) return req.reject(404, 'booking not found')
      if (booking.status !== 'ReadyForSwap') {
        return req.reject(409, `a booking in status ${booking.status} cannot be swapped`)
      }

      await UPDATE.entity(Bookings, booking.ID).with({ status: 'Done' })
      return SELECT.one.from(req.subject)
    })

    return super.init()
  }
}
