namespace booking;

using { cuid, managed } from '@sap/cds/common';

entity Customers : cuid {
  name  : String(100) not null;
  email : String(200);
}

entity Bookings : cuid, managed {
  customer : Association to Customers;
  tireSpec : String(50) not null;
  garageId : String(20) not null;
  status   : String(20) enum { Created; ReadyForSwap; Done; Cancelled; } default 'Created';
}
