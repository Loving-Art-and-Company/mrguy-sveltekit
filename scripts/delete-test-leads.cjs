require('dotenv/config');
const postgres = require('postgres');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required to delete test leads.');
  process.exit(1);
}

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';
const testPhones = [
  '9541234567',
  '9549876543',
  '9545551234',
  '9547778899',
  '9541112233',
  '9544445566',
  '9546667788',
  '9548889900',
  '9541239876',
  '9549871234'
];
const testNames = [
  'John Smith',
  'Jane Doe',
  'Bob Johnson',
  'Alice Williams',
  'Charlie Brown',
  'Diana Prince',
  'Edward Norton',
  'Fiona Apple',
  'George Lucas',
  'Hannah Montana',
  'E2E Test User',
  'E2E Upgrade Test'
];

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 });

async function main() {
  const candidates = await sql`
    SELECT id, contact, "clientName"
    FROM bookings
    WHERE brand_id = ${MRGUY_BRAND_ID}
      AND (
        contact = ANY(${sql(testPhones)})
        OR "clientName" = ANY(${sql(testNames)})
        OR notes ILIKE '%example.invalid%'
      )
  `;

  if (candidates.length === 0) {
    console.log('No test leads found.');
    await sql.end();
    return;
  }

  console.log(`Deleting ${candidates.length} matching test lead(s):`);
  candidates.forEach((lead) => {
    console.log(` - ${lead.id} (${lead.contact} / ${lead.clientName})`);
  });

  const ids = candidates.map((lead) => lead.id);
  await sql`
    DELETE FROM bookings
    WHERE id = ANY(${sql(ids)})
  `;

  console.log('Deletion complete.');
  await sql.end();
}

main().catch((err) => {
  console.error('Failed to delete test leads:', err);
  process.exitCode = 1;
});
