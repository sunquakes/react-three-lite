---
id: deepseek-harness
lang: en-US
title: DeepSeek Harness
---

# Configure DeepSeek Harness

DeepSeek Harness (`dsh`) reads skills from `~/.dsh/skills`, or from
`$DSH_HOME/skills` when you have set `DSH_HOME`. Install the skill once there and
every project on this computer can use it.

## 1. Download the skill

[Download react-three-lite.zip](pathname:///skills/react-three-lite.zip)

Or paste a line instead:

```bash
curl -LO https://r3l.sunquakes.com/skills/react-three-lite.zip
```

**What you should see:** a file called `react-three-lite.zip` containing one
folder with `SKILL.md`.

## 2. Unpack it into the skills folder

```bash
# macOS / Linux
mkdir -p "${DSH_HOME:-$HOME/.dsh}/skills"
unzip -o ~/Downloads/react-three-lite.zip -d "${DSH_HOME:-$HOME/.dsh}/skills"
```

```powershell
# Windows (PowerShell)
$root = if ($env:DSH_HOME) { $env:DSH_HOME } else { "$HOME\.dsh" }
$dest = Join-Path $root "skills"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Expand-Archive -Path "$HOME\Downloads\react-three-lite.zip" -DestinationPath $dest -Force
```

**What you should see:** `react-three-lite/SKILL.md` inside that skills folder.

:::caution Do not put it inside a project folder
A project-level skill vanishes the moment you move to another folder. The home
folder (or `DSH_HOME`) is the only place Harness scans for every project.
:::

## 3. Check DeepSeek Harness can see it

Start a new session and ask:

```text
Do you have a skill for building 3D scenes with react-three-lite?
```

**What you should see:** it names `react-three-lite` and describes building
scenes, effects and model loaders.

If it says no, restart the session — skills are only scanned at startup. If it
still says no, ask it to read `~/.dsh/skills/react-three-lite/SKILL.md` (or the
`$DSH_HOME` equivalent) and tell you whether the first line is exactly `---`. A
skill with broken frontmatter is ignored **without any error message**, so it
looks like the download failed when it did not.

## Next

See [AI Agents](/guide/ai) for prompts that work, or start from
[Scene](/guide/scene).
