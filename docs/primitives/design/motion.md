---
title: 'Design primitive - motion'
status: draft
date: 2026-06-28
owner: fabric-os
document_type: reference
tier: operating
tags: ['design', 'motion', 'animation']
review_cycle: on-change
---

# Motion

Defines motion, animation, transition, and code-driven video direction for Fabric OS.

## Motion Roles

| Role         | Use                                                                      |
| ------------ | ------------------------------------------------------------------------ |
| Feedback     | Confirm state changes, completion, validation, or errors.                |
| Orientation  | Help users understand navigation, hierarchy, and spatial change.         |
| Continuity   | Smooth transitions between related states without hiding latency.        |
| Emphasis     | Draw attention to a priority action or important status change.          |
| Storytelling | Explain product value, workflow, or system behavior in demos and videos. |

## Rules

- Motion must clarify state or narrative; avoid decorative movement that competes with comprehension.
- Keep operational UI motion short, subtle, and interruptible.
- Respect reduced-motion preferences where applicable.
- Do not use motion to mask unresolved loading, missing state, or unclear information architecture.
- Generated or rendered videos must follow the assets primitive for storage and review.

## References

| Reference                                                | Use                                                                           | Boundary                                                                               |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [Remotion](https://github.com/remotion-dev/remotion)     | Programmatic video and motion composition with React.                         | Reference pattern only; review license before production use.                          |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | HTML-native deterministic video rendering and agent-assisted video workflows. | Reference pattern only; review license and runtime requirements before production use. |
