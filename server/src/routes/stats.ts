import { Router, type Request, type Response } from 'express';

export const statsRouter = Router();

async function getUserFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const supabase = req.app.locals.supabase;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id ?? null;
}

statsRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = await getUserFromToken(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supabase = req.app.locals.supabase;

    const { count: memberCount } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: headCount } = await supabase
      .from('family_heads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: heads } = await supabase
      .from('family_heads')
      .select('generation')
      .eq('user_id', userId);

    const maxGen = Math.max(0, ...(heads ?? []).map((h: { generation: number }) => h.generation));

    res.json({
      totalMembers: memberCount ?? 0,
      totalFamilyHeads: headCount ?? 0,
      totalGenerations: maxGen,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
