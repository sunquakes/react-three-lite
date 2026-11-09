---
lang: zh-CN
title: 配置 Codex CLI
---

# 配置 Codex CLI

Codex CLI 从 `~/.codex/skills` 读取个人技能。在这里安装一次，这台电脑上的所有项目
都能使用。

## 1. 下载技能

[下载 react-three-lite.zip](pathname:///skills/react-three-lite.zip)

或者直接粘贴命令：

```bash
curl -LO https://r3l.sunquakes.com/skills/react-three-lite.zip
```

**你应该看到：** 一个名为 `react-three-lite.zip` 的文件，里面只有一个文件夹，其中是
`SKILL.md`。

## 2. 解压到技能目录

```bash
# macOS / Linux
mkdir -p ~/.codex/skills
unzip -o ~/Downloads/react-three-lite.zip -d ~/.codex/skills
```

```powershell
# Windows (PowerShell)
$dest = "$HOME\.codex\skills"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Expand-Archive -Path "$HOME\Downloads\react-three-lite.zip" -DestinationPath $dest -Force
```

**你应该看到：** `~/.codex/skills/react-three-lite/SKILL.md`。

:::caution 不要放进项目目录
放在项目里的技能，一旦切换到别的目录就找不到了。主目录才是 Codex CLI 为所有项目
查找技能的位置。
:::

## 3. 确认 Codex CLI 能找到它

开启新会话并询问：

```text
Do you have a skill for building 3D scenes with react-three-lite?
```

**你应该看到：** 它说出 `react-three-lite`，并描述如何构建场景、效果和模型加载。

如果它说没有，请重启会话——技能只在启动时扫描。如果仍然没有，让它读取
`~/.codex/skills/react-three-lite/SKILL.md` 并回答第一行是否正好是 `---`。前置信息
有误的技能会被**静默忽略**，看起来像下载失败，其实不是。

## 下一步

回到 [AI 智能体](/zh-CN/guide/ai) 查看有效的提问方式，或从
[Scene](/zh-CN/guide/scene) 页面开始搭建场景。
