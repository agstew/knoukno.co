export async function GET() {
  return Response.json({
    ok: true,
    service: 'knoukno.co',
    environment: process.env.NODE_ENV || 'development',
  })
}
