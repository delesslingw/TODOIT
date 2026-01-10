# TODOIT

## Important Commands
- Build Dev Client: `eas build -p android --profile development`
- Build Standalone Preview : `eas build -p android --profile preview`
- Build Preview Locally (untested): `eas build -p android --profile preview --local`
- Push OTA JS Update: `npx eas update --channel preview --message "Your Message"`


## TODO
- [ ] Pull down refresh
- [ ] add options for list with delete list capabilities
- [ ]
- [ ] Add notifications
- [ ] Fix scroll in Task Lists
- [ ] Add gesture close for ACCOMPLISHMENT
- [ ] Add delete task functionality
- [ ] add edit task functionality
- [ ] refine loading screen
- [ ] Vibrate on check??
- [ ] Visualize parent and child tasks
- [x] Refactor to ReactQuery
- [x] Filter completed tasks
- [x] Refactor to context
## Possible States
- State A: Timer not running
- State B: Task Timer started, one task is 'highlighted'. all other tasks are disabled, if highlighted task is checked then a prompt shows "Do you want to end this session or continue with other tasks?" End goes to State A and the latter goes to State C. If timer ends goes to State D
- State C: Task timer started, no task highlighted, clicked on the timer shows a prompt to end the session or continue. If the session is ended by prompt or timing out go to State D
- State D: Accomplishment Screen!
