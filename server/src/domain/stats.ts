// Pure progress math: no database, no network.

export type AnsweredQuestion = { topicId: string | null; score: number; submittedAt: Date };

export type TopicStat = {
  topicId: string;
  answered: number; // all-time questions answered on this topic
  accuracy: number; // 0..1 over the most recent answers only
  lastPracticed: Date;
  weak: boolean;
};

// Accuracy uses only the latest answers per topic, so improvement shows up quickly
// instead of being dragged down by early mistakes.
export const RECENT_ANSWERS = 10;
// A topic counts as weak below 70%, once there are enough answers to judge.
export const WEAK_BELOW = 0.7;
export const MIN_ANSWERS_TO_JUDGE = 2;

export function topicStats(answers: AnsweredQuestion[]): TopicStat[] {
  const byTopic = new Map<string, AnsweredQuestion[]>();
  for (const a of answers) {
    if (!a.topicId) continue;
    const list = byTopic.get(a.topicId) ?? [];
    list.push(a);
    byTopic.set(a.topicId, list);
  }

  return [...byTopic.entries()].map(([topicId, list]) => {
    const newestFirst = [...list].sort((x, y) => y.submittedAt.getTime() - x.submittedAt.getTime());
    const recent = newestFirst.slice(0, RECENT_ANSWERS);
    const accuracy = recent.reduce((sum, a) => sum + a.score, 0) / recent.length;
    return {
      topicId,
      answered: list.length,
      accuracy,
      lastPracticed: newestFirst[0].submittedAt,
      weak: list.length >= MIN_ANSWERS_TO_JUDGE && accuracy < WEAK_BELOW,
    };
  });
}
