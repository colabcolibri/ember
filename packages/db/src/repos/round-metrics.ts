import type Database from 'better-sqlite3';
import {
  computeNoShowRate,
  uniqueSorted,
  type RoundDiversityMetrics,
  type RoundMetricsSnapshot,
} from '@ember/domain';

function parseCountry(placeJson: string | null): string | null {
  if (!placeJson) return null;
  try {
    const place = JSON.parse(placeJson) as { country?: string; countryCode?: string };
    return place.country ?? place.countryCode ?? null;
  } catch {
    return null;
  }
}

function countNewPairs(db: Database.Database, communityId: string, roundId: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c
       FROM meeting_participations mp
       JOIN circles c ON c.id = mp.circle_id
       WHERE mp.community_id = ? AND c.round_id = ?`,
    )
    .get(communityId, roundId) as { c: number };
  return row.c;
}

function countNoShow(db: Database.Database, roundId: string): RoundMetricsSnapshot['noShow'] {
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS invited,
         SUM(CASE WHEN cm.attendance IS NOT NULL THEN 1 ELSE 0 END) AS responded,
         SUM(CASE WHEN cm.attendance = 'yes' THEN 1 ELSE 0 END) AS yes_count,
         SUM(CASE WHEN cm.attendance = 'no' THEN 1 ELSE 0 END) AS no_count
       FROM circle_members cm
       JOIN circles c ON c.id = cm.circle_id
       WHERE c.round_id = ?`,
    )
    .get(roundId) as {
    invited: number;
    responded: number | null;
    yes_count: number | null;
    no_count: number | null;
  };

  const yes = row.yes_count ?? 0;
  const no = row.no_count ?? 0;

  return {
    invited: row.invited ?? 0,
    responded: row.responded ?? 0,
    yes,
    no,
    rate: computeNoShowRate(yes, no),
  };
}

function loadDiversity(db: Database.Database, communityId: string, roundId: string): RoundDiversityMetrics {
  const rows = db
    .prepare(
      `SELECT mp.edition_year, mp.languages_json, mp.residence_place_json
       FROM circle_members cm
       JOIN circles c ON c.id = cm.circle_id
       JOIN member_profiles mp ON mp.user_id = cm.user_id AND mp.community_id = ?
       WHERE c.round_id = ?`,
    )
    .all(communityId, roundId) as {
    edition_year: number | null;
    languages_json: string | null;
    residence_place_json: string | null;
  }[];

  const editionYears: number[] = [];
  const languages: string[] = [];
  const countries: string[] = [];

  for (const row of rows) {
    if (row.edition_year) editionYears.push(row.edition_year);
    if (row.languages_json) {
      try {
        const parsed = JSON.parse(row.languages_json) as string[];
        languages.push(...parsed);
      } catch {
        // ignore malformed profile data
      }
    }
    const country = parseCountry(row.residence_place_json);
    if (country) countries.push(country);
  }

  return {
    editionYears: uniqueSorted(editionYears),
    languages: uniqueSorted(languages),
    countries: uniqueSorted(countries),
  };
}

function countUnmatched(db: Database.Database, roundId: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c
       FROM round_declarations rd
       WHERE rd.round_id = ?
         AND rd.user_id NOT IN (
           SELECT cm.user_id
           FROM circle_members cm
           JOIN circles c ON c.id = cm.circle_id
           WHERE c.round_id = ?
         )`,
    )
    .get(roundId, roundId) as { c: number };
  return row.c;
}

export function findPreviousRoundId(
  db: Database.Database,
  communityId: string,
  roundId: string,
): string | null {
  const row = db
    .prepare(
      `SELECT prev.id
       FROM rounds current
       JOIN rounds prev ON prev.community_id = current.community_id AND prev.created_at < current.created_at
       WHERE current.id = ? AND current.community_id = ?
       ORDER BY prev.created_at DESC
       LIMIT 1`,
    )
    .get(roundId, communityId) as { id: string } | undefined;
  return row?.id ?? null;
}

export function loadRoundMetricsSnapshot(
  db: Database.Database,
  communityId: string,
  roundId: string,
): RoundMetricsSnapshot {
  return {
    newPairs: countNewPairs(db, communityId, roundId),
    noShow: countNoShow(db, roundId),
    diversity: loadDiversity(db, communityId, roundId),
    exceptions: { unmatched: countUnmatched(db, roundId) },
  };
}
