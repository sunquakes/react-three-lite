---
id: claude-code
lang: en-US
title: Claude Code
---

# Configure Claude Code

Claude Code reads personal skills from `~/.claude/skills`. Install the skill once
there and every project on this computer can use it.

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
mkdir -p ~/.claude/skills
unzip -o ~/Downloads/react-three-lite.zip -d ~/.claude/skills
```

```powershell
# Windows (PowerShell)
$dest = "$HOME\.claude\skills"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Expand-Archive -Path "$HOME\Downloads\react-three-lite.zip" -DestinationPath $dest -Force
```

**What you should see:** `~/.claude/skills/react-three-lite/SKILL.md`.

:::caution Do not put it inside a project folder
A project-level skill vanishes the moment you move to another folder. The home
folder is the only place Claude Code scans for every project.
:::

## 3. Check Claude Code can see it

Start a new session and ask:

```text
Do you have a skill for building 3D scenes with react-three-lite?
```

**What you should see:** it names `react-three-lite` and describes building
scenes, effects and model loaders.

If it says no, restart the session — skills are only scanned at startup. If it
still says no, ask it to read `~/.claude/skills/react-three-lite/SKILL.md` and
tell you whether the first line is exactly `---`. A skill with broken frontmatter
is ignored **without any error message**, so it looks like the download failed
when it did not.

## Next

See [AI Agents](/guide/ai) for prompts that work, or start from
[Scene](/guide/scene).
