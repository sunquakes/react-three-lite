---
lang: zh-CN
title: 配置 DeepSeek Harness
---

# 配置 DeepSeek Harness

DeepSeek Harness（`dsh`）从 `~/.dsh/skills` 读取技能；如果你设置了 `DSH_HOME`，
则使用 `$DSH_HOME/skills`。在这里安装一次，这台电脑上的所有项目都能使用。

## 1. 下载技能

<a className="r3l-download" href="/skills/react-three-lite.zip">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
  <span>下载 react-three-lite.zip</span>
</a>

或者直接粘贴命令：

```bash
curl -LO https://r3l.sunquakes.com/skills/react-three-lite.zip
```

**你应该看到：** 一个名为 `react-three-lite.zip` 的文件，里面只有一个文件夹，其中是
`SKILL.md`。

## 2. 解压到技能目录

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

**你应该看到：** 该技能目录下的 `react-three-lite/SKILL.md`。

:::caution 不要放进项目目录
放在项目里的技能，一旦切换到别的目录就找不到了。主目录（或 `DSH_HOME`）才是 Harness
为所有项目查找技能的位置。
:::

## 3. 确认 DeepSeek Harness 能找到它

开启新会话并询问：

```text
Do you have a skill for building 3D scenes with react-three-lite?
```

**你应该看到：** 它说出 `react-three-lite`，并描述如何构建场景、效果和模型加载。

如果它说没有，请重启会话——技能只在启动时扫描。如果仍然没有，让它读取
`~/.dsh/skills/react-three-lite/SKILL.md`（或 `$DSH_HOME` 下的对应路径）并回答第一行
是否正好是 `---`。前置信息有误的技能会被**静默忽略**，看起来像下载失败，其实不是。

## 下一步

回到 [AI 智能体](/zh-CN/guide/ai) 查看有效的提问方式，或从
[Scene](/zh-CN/guide/scene) 页面开始搭建场景。
