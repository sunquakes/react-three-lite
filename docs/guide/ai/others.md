---
id: others
lang: en-US
title: Other Agents
---

# Configure Another Agent

Agents that follow the shared `~/.agents/skills` convention — including DeepSeek
Deep Code — read personal skills from that folder. Install the skill once there
and every project on this computer can use it.

## 1. Download the skill

<a className="r3l-download" href="/skills/react-three-lite.zip">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
  <span>Download react-three-lite.zip</span>
</a>

Or paste a line instead:

```bash
curl -LO https://r3l.sunquakes.com/skills/react-three-lite.zip
```

**What you should see:** a file called `react-three-lite.zip` containing one
folder with `SKILL.md`.

## 2. Unpack it into the skills folder

```bash
# macOS / Linux
mkdir -p ~/.agents/skills
unzip -o ~/Downloads/react-three-lite.zip -d ~/.agents/skills
```

```powershell
# Windows (PowerShell)
$dest = "$HOME\.agents\skills"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Expand-Archive -Path "$HOME\Downloads\react-three-lite.zip" -DestinationPath $dest -Force
```

**What you should see:** `~/.agents/skills/react-three-lite/SKILL.md`.

If your agent uses a project-level folder instead, unpack into
`<project>/.agents/skills` (or the folder its documentation names) and repeat it
for each project.

## 3. Check the agent can see it

Start a new session and ask:

```text
Do you have a skill for building 3D scenes with react-three-lite?
```

**What you should see:** it names `react-three-lite` and describes building
scenes, effects and model loaders.

If it says no, restart the session — skills are only scanned at startup. If it
still says no, ask it to read `~/.agents/skills/react-three-lite/SKILL.md` and
tell you whether the first line is exactly `---`. A skill with broken frontmatter
is ignored **without any error message**, so it looks like the download failed
when it did not.

## Next

See [AI Agents](/guide/ai) for prompts that work, or start from
[Scene](/guide/scene).
