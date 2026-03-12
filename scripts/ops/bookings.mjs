import postgres from 'postgres';
import { loadLocalEnv } from './env.mjs';

const BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

function startOfTodayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateStr, days) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export async function getBookingOpsSnapshot() {
  loadLocalEnv();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for ops booking snapshot');
  }

  const sql = postgres(connectionString, { ssl: 'require', max: 1 });

  try {
    const today = startOfTodayLocal();
    const nextWeek = addDays(today, 7);

    const [todayCountRow] = await sql`
      select count(*)::int as count
      from bookings
      where brand_id = ${BRAND_ID} and date = ${today}
    `;

    const [upcomingCountRow] = await sql`
      select count(*)::int as count
      from bookings
      where brand_id = ${BRAND_ID}
        and date >= ${today}
        and date < ${nextWeek}
    `;

    const stalePending = await sql`
      select id, "clientName" as client_name, "serviceName" as service_name, date, time, status, "paymentStatus" as payment_status, created_at
      from bookings
      where brand_id = ${BRAND_ID}
        and status in ('pending', 'rescheduled')
        and created_at < now() - interval '24 hours'
      order by created_at asc
      limit 20
    `;

    const paidPending = await sql`
      select id, "clientName" as client_name, "serviceName" as service_name, date, time, status, "paymentStatus" as payment_status, created_at
      from bookings
      where brand_id = ${BRAND_ID}
        and status in ('pending', 'rescheduled')
        and "paymentStatus" = 'paid'
      order by created_at asc
      limit 20
    `;

    const recentBookings = await sql`
      select id, "clientName" as client_name, "serviceName" as service_name, date, time, status, "paymentStatus" as payment_status, created_at
      from bookings
      where brand_id = ${BRAND_ID}
        and created_at >= now() - interval '24 hours'
      order by created_at desc
      limit 20
    `;

    const upcomingBookings = await sql`
      select id, "clientName" as client_name, "serviceName" as service_name, date, time, status, "paymentStatus" as payment_status, created_at
      from bookings
      where brand_id = ${BRAND_ID}
        and date >= ${today}
        and date < ${nextWeek}
      order by date asc, time asc nulls last
      limit 20
    `;

    const actions = [];

    if (stalePending.length > 0) {
      actions.push({
        severity: 'high',
        type: 'stale_pending',
        message: `${stalePending.length} pending or rescheduled bookings are older than 24 hours`,
      });
    }

    if (paidPending.length > 0) {
      actions.push({
        severity: 'high',
        type: 'paid_pending',
        message: `${paidPending.length} paid bookings still need confirmation or follow-up`,
      });
    }

    if (Number(todayCountRow?.count ?? 0) === 0) {
      actions.push({
        severity: 'medium',
        type: 'empty_today',
        message: 'No bookings scheduled for today',
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      today,
      counts: {
        today: Number(todayCountRow?.count ?? 0),
        next7Days: Number(upcomingCountRow?.count ?? 0),
        recent24Hours: recentBookings.length,
        stalePending: stalePending.length,
        paidPending: paidPending.length,
      },
      recentBookings,
      upcomingBookings,
      stalePending,
      paidPending,
      actions,
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const jsonMode = process.argv.includes('--json');
  const snapshot = await getBookingOpsSnapshot();

  if (jsonMode) {
    console.log(JSON.stringify(snapshot, null, 2));
  } else {
    console.log(`# Booking Ops Snapshot`);
    console.log(`Generated: ${snapshot.generatedAt}`);
    console.log(`Today bookings: ${snapshot.counts.today}`);
    console.log(`Next 7 days: ${snapshot.counts.next7Days}`);
    console.log(`Recent 24 hours: ${snapshot.counts.recent24Hours}`);
    console.log(`Stale pending: ${snapshot.counts.stalePending}`);
    console.log(`Paid pending: ${snapshot.counts.paidPending}`);
  }
}
