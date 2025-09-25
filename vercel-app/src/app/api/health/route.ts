export async function GET() {
  return Response.json({
    ok:true,
    env:{
      OPENAI: !!process.env.OPENAI_API_KEY || false
    }
  });
}
