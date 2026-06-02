const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const METRO_PORTS = [8081, 8082];

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readLocalPropertiesSdkDir() {
  const localProps = path.join(__dirname, "..", "android", "local.properties");
  if (!fileExists(localProps)) {
    return null;
  }

  const content = fs.readFileSync(localProps, "utf8");
  const match = content.match(/^\s*sdk\.dir=(.+)$/m);
  if (!match) {
    return null;
  }

  return match[1].trim().replace(/\\/g, path.sep);
}

function adbCandidates() {
  const adbName = process.platform === "win32" ? "adb.exe" : "adb";
  const candidates = [];

  const sdkRoots = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    readLocalPropertiesSdkDir(),
    process.platform === "win32"
      ? path.join(process.env.LOCALAPPDATA ?? "", "Android", "Sdk")
      : path.join(os.homedir(), "Android", "Sdk"),
  ].filter(Boolean);

  for (const sdkRoot of sdkRoots) {
    candidates.push(path.join(sdkRoot, "platform-tools", adbName));
  }

  candidates.push(adbName);
  return candidates;
}

function resolveAdb() {
  for (const candidate of adbCandidates()) {
    if (candidate === "adb" || candidate === "adb.exe") {
      const found = spawnSync(candidate, ["version"], { encoding: "utf8" });
      if (found.status === 0) {
        return candidate;
      }
      continue;
    }

    if (fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function runAdb(adb, args) {
  return spawnSync(adb, args, { encoding: "utf8" });
}

function listDevices(adb) {
  const result = runAdb(adb, ["devices"]);
  if (result.status !== 0) {
    return { ok: false, lines: [], raw: result.stderr || result.stdout || "" };
  }

  const lines = (result.stdout || "")
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean);

  const ready = lines.filter((line) => /\tdevice$/.test(line));
  const offline = lines.filter((line) => /\t(offline|unauthorized)$/.test(line));

  return { ok: true, lines, ready, offline, raw: result.stdout || "" };
}

function printNoDevicesHelp() {
  console.error("");
  console.error("adb reverse нужен только когда эмулятор или телефон уже подключены.");
  console.error("");
  console.error("Сделайте так:");
  console.error("  1. Запустите эмулятор в Android Studio (Device Manager → Play)");
  console.error("     или подключите телефон с USB-отладкой");
  console.error("  2. Дождитесь рабочего стола Android на экране");
  console.error("  3. Снова: npm run android:reverse");
  console.error("");
  console.error("Проверка вручную:");
  console.error('  & "$env:LOCALAPPDATA\\Android\\Sdk\\platform-tools\\adb.exe" devices');
  console.error("");
  console.error("В списке должна быть строка вида: emulator-5554   device");
  console.error("");
  console.error("Если статус unauthorized — подтвердите отладку на телефоне.");
  console.error("Если offline — перезапустите эмулятор.");
}

function runReverse(adb, port) {
  const result = runAdb(adb, ["reverse", `tcp:${port}`, `tcp:${port}`]);
  if (result.status !== 0) {
    const message = `${result.stderr || ""}\n${result.stdout || ""}`.trim();
    throw new Error(message || `adb reverse failed for port ${port}`);
  }
  console.log(`OK: adb reverse tcp:${port} tcp:${port}`);
}

const adb = resolveAdb();
if (!adb) {
  console.error("adb not found.");
  console.error("");
  console.error("Install Android SDK Platform-Tools (Android Studio) and either:");
  console.error("  1. Add platform-tools to PATH, or");
  console.error("  2. Set ANDROID_HOME to your SDK folder, e.g.:");
  console.error('     $env:ANDROID_HOME = "$env:LOCALAPPDATA\\Android\\Sdk"');
  console.error("");
  console.error("Typical adb path on Windows:");
  console.error("  %LOCALAPPDATA%\\Android\\Sdk\\platform-tools\\adb.exe");
  process.exit(1);
}

console.log(`Using adb: ${adb}`);

const devices = listDevices(adb);
if (!devices.ok) {
  console.error("Failed to list adb devices.");
  if (devices.raw) {
    console.error(devices.raw.trim());
  }
  process.exit(1);
}

if (devices.ready.length === 0) {
  console.error("No Android devices/emulators found.");
  if (devices.lines.length > 0) {
    console.error("");
    console.error("adb devices:");
    for (const line of devices.lines) {
      console.error(`  ${line}`);
    }
  }
  printNoDevicesHelp();
  process.exit(1);
}

console.log(`Connected: ${devices.ready.map((line) => line.split("\t")[0]).join(", ")}`);

try {
  for (const port of METRO_PORTS) {
    runReverse(adb, port);
  }
} catch (error) {
  console.error("");
  console.error(String(error.message || error).trim());
  printNoDevicesHelp();
  process.exit(1);
}
