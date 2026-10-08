import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/firebase";
import { getMetricsData } from "@/lib/redis";

export async function GET() {
  try {
    const redisStats = await getMetricsData();
    const metrics = await getDashboardMetrics(
      redisStats.avgQueryTimeMs,
      redisStats.queriesServed
    );
    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
