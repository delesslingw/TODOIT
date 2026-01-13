# TODOIT

## Important Commands
- Build Dev Client: `eas build -p android --profile development`
- Build Standalone Preview : `eas build -p android --profile preview`
- Build Preview Locally: `eas build --platform android --local --profile preview`
  - If you run into metaspace issues consider running:
    - `export JAVA_TOOL_OPTIONS="-XX:MaxMetaspaceSize=1024m"
      export GRADLE_OPTS="-Dorg.gradle.jvmargs='-Xmx4g -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8'"
      export KOTLIN_DAEMON_JVMARGS="-Xmx2g -XX:MaxMetaspaceSize=1024m"
      export NODE_OPTIONS="--max-old-space-size=8192"
- Push OTA JS Update: `npx eas update --channel preview --message "Your Message"`


## TODO
- [ ] Pull down refresh
- [ ] add options for list with delete list capabilities
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
