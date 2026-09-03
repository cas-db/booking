export type BookingStatus = 'Created' | 'ReadyForSwap' | 'Done' | 'Cancelled'

export type Customer = {
  ID: string
  name: string
  email?: string | null
}

export type Booking = {
  ID: string
  tireSpec: string
  garageId: string
  status: BookingStatus
  customer_ID?: string | null
  customer?: Customer | null
}

export type NewBooking = {
  tireSpec: string
  garageId: string
  customer_ID?: string
}
