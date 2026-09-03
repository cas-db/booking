using { booking as db } from '../db/schema';

@path: '/booking'
service BookingService {
  entity Customers as projection on db.Customers;
  entity Bookings  as projection on db.Bookings actions {
    action confirmSwap() returns Bookings;
    action cancel() returns Bookings;
  };
}
