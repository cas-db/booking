namespace workshop;

using { cuid } from '@sap/cds/common';

// Placeholder entity. The warm-up issue renames it to the first entity of your spec.
entity Greetings : cuid {
  text : String(100) not null;
}
