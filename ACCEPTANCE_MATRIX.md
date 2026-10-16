# Acceptance matrix

| Requirement                      | Evidence / intended check                                        | State                        |
| -------------------------------- | ---------------------------------------------------------------- | ---------------------------- |
| DBL-001 pillars                  | GAME_DESIGN.md pillars and measurable targets                    | specified                    |
| DBL-002 mechanics                | resource/action/death contracts                                  | specified; values deferred   |
| DBL-003 encounters               | melee and caster scenarios                                       | specified                    |
| DBL-004 camera/input             | projection, controls, accessibility                              | specified                    |
| DBL-005 fun test                 | five sessions and observed targets                               | specified; gameplay deferred |
| DBL-006 design/art documentation | linked design and art bible                                      | specified                    |
| DBL-007 foundation               | typecheck/lint/unit/build                                        | passed locally               |
| DBL-008 comparison               | both query-selected engine demos; lights/50 sprites; screenshots | passed locally               |
| DBL-009 architecture             | adapter boundary and ADR                                         | documented                   |
| DBL-010 CI/Pages                 | workflow plus hosted smoke                                       | passed hosted                |
| DBL-011 conventions              | AGENTS/status/templates/import                                   | prepared                     |
| DBL-012 simulation               | seed/tick/replay tests                                           | passed locally               |
| DBL-013 diagnostics              | FPS/p95/ready, optional GL calls and supported heap              | passed locally               |

G0 additionally requires publication verification and user approval of engine ADR. No approval is inferred from passing tests.

## Control and fun-test review procedure (DBL-004–006)

Before movement implementation, review camera scale at 1280×800 and 1920×1080 and map every action to a remappable input. Keyboard-only UI and reduced-motion controls must be demonstrated. During the first combat playtest, record five ten-minute sessions with seed, weapon, input trace, unintended targets, feedback p95 and a short player rating. Review the melee and caster encounters independently; an aggregate score cannot hide a failed hazard/readability case. Current pass is specification review only, not gameplay acceptance.
