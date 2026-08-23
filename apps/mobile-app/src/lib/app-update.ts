export type VersionComparison = -1 | 0 | 1;

export function compareVersions(current: string, target: string): VersionComparison {
  const currentParts = parseVersion(current);
  const targetParts = parseVersion(target);
  const length = Math.max(currentParts.length, targetParts.length);
  for (let index = 0; index < length; index += 1) {
    const left = currentParts[index] ?? 0;
    const right = targetParts[index] ?? 0;
    if (left < right) return -1;
    if (left > right) return 1;
  }
  return 0;
}

export function shouldPromptForUpdate(input: {
  currentVersion: string;
  latestVersion: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
}) {
  const belowLatest = compareVersions(input.currentVersion, input.latestVersion) < 0;
  const belowMinimum = compareVersions(input.currentVersion, input.minSupportedVersion) < 0;
  return {
    required: belowMinimum || (belowLatest && input.forceUpdate),
    recommended: belowLatest,
    shouldPrompt: belowLatest || belowMinimum,
  };
}

function parseVersion(value: string) {
  return value
    .split(".")
    .map((part) => Number.parseInt(part.replace(/\D/g, ""), 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}
