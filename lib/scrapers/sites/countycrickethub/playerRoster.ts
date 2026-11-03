import { countyNameFromTeamId } from "@/lib/scrapers/sites/countycrickethub/teams";

const CCH_BASE = "https://countycrickethub.net";

export type CchRawPlayer = {
  player_id: number;
  name: string;
  birth_date: string | null;
  born: string | null;
  bat: string | null;
  field: string | null;
  role?: number | null;
  cricinfo_id?: number | null;
  cricinfo_link?: string | null;
  team_id?: number | null;
  loanteam_id?: number | null;
  overseas?: number | null;
  squad_no?: string | null;
  contract_type?: string | null;
  contract_ends?: string | null;
};

export type CchPlayerProfile = {
  playerId: number;
  name: string;
  dateOfBirth: string | null;
  age: number | null;
  batHand: string | null;
  bowlingStyle: string | null;
  born: string | null;
  counties: string[];
  site: "M" | "F";
  cricinfoId: number | null;
  cricinfoLink: string | null;
  profileUrl: string;
  squadNumbers: string[];
};

export function teamIdsForSite(site: "M" | "F"): number[] {
  if (site === "M") {
    return Array.from({ length: 18 }, (_, i) => i + 1);
  }
  return Array.from({ length: 18 }, (_, i) => i + 200);
}

export function ageFromBirthDate(
  birthDateIso: string | null | undefined,
  asOf: Date = new Date(),
): number | null {
  if (!birthDateIso) return null;
  const birth = new Date(birthDateIso);
  if (Number.isNaN(birth.getTime())) return null;
  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDiff = asOf.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function formatDobDisplay(birthDateIso: string | null | undefined): string | null {
  if (!birthDateIso) return null;
  const d = new Date(birthDateIso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
}

export async function fetchCchSquad(teamId: number): Promise<CchRawPlayer[]> {
  const res = await fetch(`${CCH_BASE}/ccdbapi/squad/${teamId}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`County Cricket Hub squad ${teamId} HTTP ${res.status}`);
  }
  const data = (await res.json()) as CchRawPlayer[];
  return Array.isArray(data) ? data : [];
}

export async function fetchCchPlayerInfo(playerId: number): Promise<CchRawPlayer | null> {
  const res = await fetch(`${CCH_BASE}/ccdbapi/playerinfo/${playerId}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as CchRawPlayer[];
  return data[0] ?? null;
}

function siteFromTeamId(teamId: number): "M" | "F" {
  return teamId >= 200 ? "F" : "M";
}

export async function fetchAllCchPlayerProfiles(options?: {
  site?: "M" | "F" | "both";
  asOf?: Date;
}): Promise<CchPlayerProfile[]> {
  const sites: ("M" | "F")[] =
    options?.site === "both" || options?.site == null ? ["M", "F"] : [options.site];
  const asOf = options?.asOf ?? new Date();
  const byId = new Map<number, CchPlayerProfile>();

  for (const site of sites) {
    for (const teamId of teamIdsForSite(site)) {
      let squad: CchRawPlayer[];
      try {
        squad = await fetchCchSquad(teamId);
      } catch {
        continue;
      }
      if (squad.length === 0) continue;
      const county = countyNameFromTeamId(teamId, site);
      for (const p of squad) {
        const id = p.player_id;
        if (id == null) continue;
        const existing = byId.get(id);
        const squadNo = p.squad_no?.trim() || null;
        if (!existing) {
          byId.set(id, {
            playerId: id,
            name: p.name,
            dateOfBirth: formatDobDisplay(p.birth_date),
            age: ageFromBirthDate(p.birth_date, asOf),
            batHand: p.bat?.trim() || null,
            bowlingStyle: p.field?.trim() || null,
            born: p.born?.trim() || null,
            counties: [county],
            site,
            cricinfoId: p.cricinfo_id ?? null,
            cricinfoLink: p.cricinfo_link ?? null,
            profileUrl: `${CCH_BASE}/player.html?playerid=${id}`,
            squadNumbers: squadNo ? [squadNo] : [],
          });
        } else {
          if (!existing.counties.includes(county)) existing.counties.push(county);
          if (squadNo && !existing.squadNumbers.includes(squadNo)) {
            existing.squadNumbers.push(squadNo);
          }
          if (!existing.batHand && p.bat) existing.batHand = p.bat.trim();
          if (!existing.bowlingStyle && p.field) existing.bowlingStyle = p.field.trim();
          if (existing.age == null) existing.age = ageFromBirthDate(p.birth_date, asOf);
          if (!existing.dateOfBirth) existing.dateOfBirth = formatDobDisplay(p.birth_date);
        }
      }
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const CCH_PLAYER_CSV_HEADERS = [
  "playerId",
  "name",
  "dateOfBirth",
  "age",
  "batHand",
  "bowlingStyle",
  "born",
  "counties",
  "site",
  "squadNo",
  "cricinfoId",
  "profileUrl",
] as const;

export function cchPlayersToCsv(players: CchPlayerProfile[]): string {
  const escape = (v: string | number | null | undefined): string => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    CCH_PLAYER_CSV_HEADERS.join(","),
    ...players.map((p) =>
      [
        p.playerId,
        p.name,
        p.dateOfBirth,
        p.age,
        p.batHand,
        p.bowlingStyle,
        p.born,
        p.counties.join("; "),
        p.site,
        p.squadNumbers.join(";"),
        p.cricinfoId,
        p.profileUrl,
      ]
        .map(escape)
        .join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
