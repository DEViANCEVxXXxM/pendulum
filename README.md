# CHAOS — Double Pendulum Observatory

A standalone, interactive double-pendulum experiment built with **Three.js** and the **DEVIANCE / ATELIER** UI design system. The scene is a cinematic visualization of a numerical mechanics model, not a pre-rendered animation. The project has no links to other DEVIANCE scenes and is ready to publish from the root of an independent GitHub Pages repository.

## Explore the experiment

Four intentionally different viewpoints:

| View | Purpose |
| --- | --- |
| Observatory | Wide, front three-quarter cinematic view of both pendulums |
| Side Study | Oblique, raking view of the rods, masses and support hardware |
| Light Trails | Low, opposite-side view highlighting recent motion paths |
| Phase Space | Close-up of the **θ₁ vs. ω₁** phase portrait |

Adjust the initial upper/lower release angles, initial perturbation, the two masses and rod lengths, gravity, and angular damping. A **Twin comparison** switch shows how a tiny difference in θ₁ produces increasingly different trajectories. Use the other inspector tabs for playback speed, recent-trail duration, light intensity, and scene layers. The **Analysis** tab shows trajectory separation, mechanical energy, energy change, and solver rate.

Keyboard: `1`–`4` camera views, `Space` pause, `C` compare, `G` guides, `R` reset, `H` inspector, `P` capture screenshot, `F` fullscreen. Drag to orbit, scroll to zoom.

## How the physics works

The solver integrates the standard Euler–Lagrange double-pendulum equations for point masses joined by massless, rigid rods in a vertical plane. Angles are measured from the vertically downward direction. Positions and energies are calculated from the numerical state, not visual animation curves.

- Fixed-step **fourth-order Runge–Kutta (RK4), 240 Hz**. Rendering frames are independent of the integrator step size.
- Two copies of the *same* physical system, with Δθ₁ applied only to the comparison system at release.
- Initial angular velocities are zero; changes to physical parameters restart the experiment.
- With damping = 0, the system should approximately conserve its mechanical energy. The measured percent change is shown live and includes any numerical drift. With damping enabled, the change also reflects real modeled energy loss.
- The phase portrait plots wrapped θ₁ (−180° to +180°) against ω₁ (displayed over ±8 rad/s, with higher values clipped at the frame), and breaks the displayed line at angle-wrap boundaries. It is not a fitted attractor or a Lyapunov-exponent estimate.

**Limitations:** This is an idealized planar two-point-mass model. The rendered weights have visible radii, rods have thickness, and trails/glow are illustrative; their geometry, drag, collisions, support compliance, and air resistance are not part of the base dynamics. The optional damping is a simplified angular-velocity drag term. Fixed-step RK4 is accurate for the supplied settings but is not exactly energy-conserving over arbitrarily long times.

## Deploy

Extract the archive, then upload the **contents** of this folder (including `index.html` and `assets/`) to the root of your GitHub repository. Enable GitHub Pages from the repository's root branch. No build step is needed.

For local testing, run `python3 -m http.server 8000` in this folder and open <http://localhost:8000>. Opening directly as `file://` is not recommended because modern browsers restrict ES module imports. Three.js is loaded from a public CDN using the HTML import map, so the browser needs an internet connection.

To run the pure mathematical validation without installing packages: `node tests/physics-test.mjs`. It tests finite solutions and energy conservation over 70 seconds, then checks that damping decreases energy.

## Project files

```text
index.html                  — scene UI and local import map
assets/atelier-ui.css       — shared ATELIER standalone UI theme
assets/atelier-ui.js        — shared standalone UI behaviour
assets/chaos-physics.js     — coupled dynamics, RK4 integrator, energy and positions
assets/chaos-scene.js       — WebGL visualization, controls and instrument panels
tests/physics-test.mjs      — pure mathematical solver checks
package.json                — ES module metadata and optional local commands
```

Accent: **warm amber `#f5b96e`**, with cyan reserved for the perturbed comparison trajectory. No other project repositories or scene switchers are referenced.
