# Level Up Dashboard - Remaining Tasks & Improvements

## 📱 UI/UX Improvements
- [ ] **Modal Consistency**: Update "Delete Confirmation" modal to use the same fixed header/footer layout as "Add Quest" and "Add Challenge" modals for better mobile experience.
- [ ] **Mobile Navigation**: Verify that the bottom navigation bar does not obscure any other interactive elements (z-index fixes applied, but visual check needed).
- [ ] **Double Dropdown**: Confirm that replacing native `<select>` with Shadcn `<Select>` has fully resolved the double icon issue across all browsers/devices.
- [ ] **Toast Notifications**: Ensure toasts are not overlapping with the bottom navigation or other fixed elements on mobile.

## 🛠️ Code Quality & Refactoring
- [ ] **Achievement Logic**: Refactor achievement unlock logic (currently in `app/realm/page.tsx`) into a dedicated hook or service (e.g., `useAchievementUnlock`) to centralize persistence checks and avoid code duplication.
- [ ] **Type Safety**: Add proper TypeScript interfaces for all modal state objects (e.g., `newMilestone`, `newQuest`) to avoid `any` types and improve maintainability.
- [ ] **Component Reusability**: Extract the "Modal Layout" (Fixed Header, Scrollable Content, Fixed Footer) into a reusable `ResponsiveModal` component to enforce consistency.

## 🚀 Features
- [ ] **Edit Milestones**: Implement functionality to edit existing milestones (currently only "Add" is supported).
- [ ] **Delete Milestones**: Add ability to delete custom milestones.
- [ ] **Rich Text Descriptions**: Allow rich text or markdown in quest/challenge descriptions.

## 🧪 Testing
- [ ] **Persistence Testing**: Add automated or manual test cases to verify that `localStorage` correctly persists achievement unlocks across session resets.
- [ ] **Mobile Testing**: Perform a full regression test on a real mobile device to ensure touch targets are accessible and layout is stable.
