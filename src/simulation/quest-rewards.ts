import { itemContentForVersion } from "./item-content";
import { generateLoot } from "./loot";
import { type QuestDefinition } from "./quests";
/** Pinned content3 stream, separate from encounter/container streams. No extra item IDs. */
export function questRewardItem(reward: QuestDefinition["reward"]) {
  if (reward.itemSeed === null) return null;
  for (let sequence = 0; sequence < 64; sequence++) {
    const item = generateLoot(
      {
        seed: reward.itemSeed,
        sequence,
        areaLevel: 1,
        monsterLevel: 1,
        table: "reliquary",
      },
      itemContentForVersion(3),
    );
    if (item) return item;
  }
  throw Error("Quest item reward has no valid deterministic roll");
}
