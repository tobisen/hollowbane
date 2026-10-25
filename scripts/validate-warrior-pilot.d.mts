export interface WarriorPilotAudit {
  bytes: number;
  decodedBytes: number;
  frames: {
    name: string;
    opaque: number;
    soft: number;
    isolatedSoft: number;
    bounds: number[];
  }[];
  artApproval: string;
}
export function validateWarriorPilot(
  directory?: string,
): Promise<WarriorPilotAudit>;
