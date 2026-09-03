import cds from '@sap/cds'

export default class BookingService extends cds.ApplicationService {
  async init() {
    const { Bookings } = this.entities

    await cds.connect.to('messaging')

    this.before('CREATE', Bookings, (req) => {
      if (!req.data.tireSpec?.trim()) req.reject(400, 'tireSpec must not be empty')
      if (!req.data.garageId?.trim()) req.reject(400, 'garageId must not be empty')
    })

    return super.init()
  }
}
