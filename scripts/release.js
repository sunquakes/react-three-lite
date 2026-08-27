#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Get version from command line argument or prompt
const input = process.argv[2]

if (!input) {
  console.error('Please provide a version number:')
  console.error('  npm run release 0.0.7')
  console.error('Or use predefined scripts:')
  console.error('  npm run release:patch  # Bump patch version')
  console.error('  npm run release:minor  # Bump minor version')
  console.error('  npm run release:major  # Bump major version')
  process.exit(1)
}

const packageJsonPath = path.join(rootDir, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
const oldVersion = packageJson.version

const versionRegex = /^\d+\.\d+\.\d+$/

/**
 * Resolve the target version. The argument is either an explicit semver string
 * or one of the `patch` / `minor` / `major` bump keywords, which are computed
 * relative to the version currently in package.json.
 */
function resolveVersion(arg) {
  if (versionRegex.test(arg)) {
    return arg
  }

  if (!versionRegex.test(oldVersion)) {
    console.error(`Cannot bump: package.json version "${oldVersion}" is not valid semver`)
    process.exit(1)
  }

  const [major, minor, patch] = oldVersion.split('.').map(Number)

  switch (arg) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      console.error(
        'Invalid version. Use semantic versioning (e.g., 0.0.7) or one of: patch, minor, major'
      )
      process.exit(1)
  }
}

const version = resolveVersion(input)

if (version === oldVersion) {
  console.error(`Version ${version} is already the current version in package.json`)
  process.exit(1)
}

console.log(`🚀 Releasing version ${version}...`)

console.log(`📦 Updating version from ${oldVersion} to ${version}...`)
packageJson.version = version
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

// Update CHANGELOG.md if exists
const changelogPath = path.join(rootDir, 'CHANGELOG.md')
if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, 'utf-8')
  const today = new Date().toISOString().split('T')[0]
  
  // Check if version already exists in changelog
  if (!changelog.includes(`## [${version}]`)) {
    console.log('📝 Updating CHANGELOG.md...')
    const newChangelog = `## [${version}] - ${today}\n\n### Added\n\n- Release version ${version}\n\n---\n\n${changelog}`
    fs.writeFileSync(changelogPath, newChangelog)
  }
}

// Commit changes
console.log('💾 Committing changes...')
try {
  execSync(`git add ${packageJsonPath}`, { stdio: 'inherit' })
  if (fs.existsSync(changelogPath)) {
    execSync(`git add ${changelogPath}`, { stdio: 'inherit' })
  }
  execSync(`git commit -m "chore: release version ${version}"`, { stdio: 'inherit' })
} catch (error) {
  console.log('⚠️  No changes to commit or commit failed')
}

// Create tag
console.log('🏷️  Creating git tag...')
try {
  execSync(`git tag ${version}`, { stdio: 'inherit' })
  console.log(`✅ Successfully created tag ${version}`)
} catch (error) {
  console.error(`❌ Failed to create tag ${version}. Tag might already exist.`)
  process.exit(1)
}

console.log('\n✨ Release preparation complete!')
console.log('📤 To push the release, run:')
console.log(`   git push origin --tags`)
console.log('\n🌐 GitHub Actions will automatically build and publish to NPM')
