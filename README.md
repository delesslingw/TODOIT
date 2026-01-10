# TODOIT

- [ ] Add gesture close for ACCOMPLISHMENT
- [ ] Filter completed tasks
- [ ] Vibrate on check??
- [ ] Refactor to context
- [ ] Refactor to ReactQuery
- [ ] Visualize parent and child tasks
## Possible States
- State A: Timer not running
- State B: Task Timer started, one task is 'highlighted'. all other tasks are disabled, if highlighted task is checked then a prompt shows "Do you want to end this session or continue with other tasks?" End goes to State A and the latter goes to State C. If timer ends goes to State D
- State C: Task timer started, no task highlighted, clicked on the timer shows a prompt to end the session or continue. If the session is ended by prompt or timing out go to State D
- State D: Accomplishment Screen!
