import { json } from "@solidjs/router";
import type { APIEvent } from "@solidjs/start/server";

export async function GET(event: APIEvent) {
  return json({ message: "pong" }, { status: 200 });
}
