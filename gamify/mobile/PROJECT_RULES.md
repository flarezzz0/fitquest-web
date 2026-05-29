# FitQuest Mobile App — Project Rules

## Design Philosophy
- Apple Design System (Dark mode)
- bg: #1d1d1f, card: #272729, primary: #0066cc
- SF Pro typography (system font)
- Minimal UI, high contrast, clean spacing
- Mobile ≠ Desktop — separate layouts per breakpoint

## Architecture
- Expo SDK 54 + React Native 0.81.5 + expo-router v6
- TypeScript — strict mode
- Zustand for state management
- Axios for API calls
- Dark mode only

## Layout Strategy
- Mobile (width < 1024px): Bottom Tab Navigation + 1 column
- Desktop (width ≥ 1024px): Sidebar Navigation + 2-3 column grid
- Use `useWindowDimensions()` + `Platform.OS` to detect
- No max-width hacks — separate components instead

## Component Rules
- 1 component per file
- Components go in `components/`
- Desktop-specific components prefix with `Desktop` (e.g., `DesktopDashboard`)
- No hardcoded colors/spacing — use `theme/colors.ts`
- `TouchableOpacity` for buttons, not `Text` with `onPress`

## Page Structure
- Mobile: `app/(tabs)/*.tsx` — bottom tab screens
- Desktop: `components/Desktop*.tsx` — rendered in sidebar layout

## Safe Refactor Rules
- **ห้าม rewrite full file** — patch เฉพาะ section ที่ต้องแก้
- **ห้ามแก้เกิน 1 feature ต่อรอบ**
- ต้อง `read` target section ก่อน `edit` เสมอ
- ต้อง `grep -n` หาตำแหน่งเป๊ะๆ ก่อนแก้
- `npx tsc --noEmit` ก่อน commit ทุกครั้ง
- 1 component per edit
- ถ้า edit fail → อ่านไฟล์ใหม่ทั้งหมดก่อน retry

## Code Style
- Single StyleSheet per file at bottom
- Arrow function components with explicit types
- Incremental changes only — no rewrites

## Known Issues
- Desktop pages (Upload, Quest, Shop, Profile) are placeholders
- Activity Calendar animation may need iOS optimization
- SafeAreaView on some Android devices

## Backend
- Node.js + Express on port 3456
- 7 AI Agents: MainAgent, VerificationAgent, AntiCheatAgent, 
  ModerationAgent, RewardAgent, RecommendationAgent, MemoryAgent
- Event Bus for agent-to-agent communication
