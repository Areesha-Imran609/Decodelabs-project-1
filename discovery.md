# Discovery & Wireframes

## How Might We
How might we help students and interns organise daily tasks quickly on their phone, without confusing menus?

## Empathy Map (target user: a college student / intern)
| Says | Thinks |
|------|--------|
| "I forget deadlines." | "I need one simple place for everything." |
| "Too many apps are complicated." | "Will I lose my tasks if I close the tab?" |

| Does | Feels |
|------|-------|
| Uses phone most of the day | Stressed when tasks pile up |
| Writes tasks on paper/WhatsApp | Motivated when seeing progress |

**Pain points found:** hard to read on small screens, no priority, no progress feedback, data lost on refresh.
**Solution:** priority + due dates, progress bar, localStorage, large touch targets.

## Wireframe – Mobile (single column, grayscale)
```
+------------------------+
| [logo] Tasklight [Dark][Filters]
+------------------------+
| (Filters panel opens)  |
+------------------------+
| My tasks               |
| +--------------------+ |
| | Add a task         | |
| | [ task name      ] | |
| | [priority][ date ] | |
| | [ Add task ]       | |
| +--------------------+ |
| +--------------------+ |
| | Task list  search  | |
| | [ ] Task 1 [Edit][Del]
| | [x] Task 2         | |
| +--------------------+ |
+------------------------+
| footer                 |
+------------------------+
```

## Wireframe – Desktop (>= 1024px)
```
+---------------------------------------------+
| header                                      |
+-----------+---------------------------------+
| Filters   | My tasks                        |
| - All     | [ Add task form (3 columns) ]   |
| - To do   | [ Task list (2 columns)      ]  |
| - Done    |                                 |
| Progress  |                                 |
+-----------+---------------------------------+
| footer                                      |
+---------------------------------------------+
```
> Tip: redraw these on paper / Visily / Balsamiq and add the photos to this folder as proof.
