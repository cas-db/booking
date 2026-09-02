using { workshop as db } from '../db/schema';

// Placeholder service. Rename service, path and entity to match your spec.
@path: '/hello'
service HelloService {
  entity Greetings as projection on db.Greetings;
}
