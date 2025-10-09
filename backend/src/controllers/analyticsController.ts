
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import mongoose from 'mongoose';

// excluding useless words
const STOPWORDS = new Set([
  'the','a','an','and','or','but','if','then','else','when','at','by','for','with','without','on','in','into','out',
  'to','from','of','is','am','are','was','were','be','been','being','it','this','that','these','those','as','so',
  'i','you','he','she','we','they','me','him','her','us','them','my','your','his','her','our','their',
  'not','no','yes','do','does','did','done','can','could','should','would','will','just','about','than','too','very',
  'what','which','who','whom','where','when','why','how'
]);

function normTokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[`~!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}


export const getUserBasicAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;                 // student user _id (ObjectId)
    const days = parseInt(String(req.query.days ?? '90'), 10);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user id' }); return;
    }
    const userId = new mongoose.Types.ObjectId(id);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);


    const convos = await Conversation.find({
      user_id: userId,
      status: { $ne: 'deleted' },
      started_at: { $gte: since }
    }).select('_id started_at last_activity_at').lean();

    const convoIds = convos.map(c => c._id);

    const firstValidations = await Message.aggregate([
      { $match: { conversation_id: { $in: convoIds }, validation: true } },
      { $sort: { date_created: 1 } },
      { $group: { _id: '$conversation_id', firstValidationAt: { $first: '$date_created' } } }
    ]);

    const firstValidationMap = new Map<string, Date>();
    firstValidations.forEach(d => firstValidationMap.set(String(d._id), d.firstValidationAt));

    const durations = convos.map(c => {
      const fullDurationMs = new Date(c.last_activity_at).getTime() - new Date(c.started_at).getTime();
      const fv = firstValidationMap.get(String(c._id));
      const timeToValidationMs = fv ? (new Date(fv).getTime() - new Date(c.started_at).getTime()) : null;
      return { conversationId: String(c._id), fullDurationMs, timeToValidationMs, startedAt: c.started_at, lastActivityAt: c.last_activity_at };
    });

    const nonNeg = (n: number) => (isFinite(n) && n >= 0 ? n : 0);
    const fullDurList = durations.map(d => nonNeg(d.fullDurationMs)).sort((a,b)=>a-b);
    const ttvList = durations.filter(d => d.timeToValidationMs != null).map(d => nonNeg(d.timeToValidationMs!)).sort((a,b)=>a-b);

    function pQuantile(sorted: number[], q: number): number|null {
      if (!sorted.length) return null;
      const idx = Math.floor((sorted.length - 1) * q);
      return sorted[idx];
    }
    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0) / arr.length) : null;

    const fullStats = {
      count: fullDurList.length,
      avgMs: avg(fullDurList),
      p50Ms: pQuantile(fullDurList, 0.5),
      p90Ms: pQuantile(fullDurList, 0.9)
    };
    const ttvStats = {
      count: ttvList.length,
      avgMs: avg(ttvList),
      p50Ms: pQuantile(ttvList, 0.5),
      p90Ms: pQuantile(ttvList, 0.9)
    };


    const msgs = await Message.find({
      conversation_id: { $in: convoIds },
      role: 'user',
      date_created: { $gte: since }
    }).select('content').lean();

    const freq = new Map<string, number>();
    for (const m of msgs) {
      for (const tok of normTokenize(m.content)) {
        freq.set(tok, (freq.get(tok) ?? 0) + 1);
      }
    }
    const topWords = Array.from(freq.entries())
      .sort((a,b)=>b[1]-a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    res.json({
      success: true,
      windowDays: days,
      durations,    // per-conversation rows
      stats: { fullDuration: fullStats, timeToValidation: ttvStats },
      topWords
    });
  } catch (err: any) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute analytics', error: err.message });
  }
};
