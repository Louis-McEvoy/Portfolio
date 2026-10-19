---
version: 1
name: louis-mcevoy-portfolio
description: An engineering object study. Products sit on a cool studio grey like a photographic sweep, set against very large tight grotesk type, with technical annotation (monospace specs, leader lines, corner brackets) used only where it carries real data. One acid accent marks the single action and key figures.

colors:
  ground: "#E8E9EA"      # studio sweep grey (inspo 1, 2)
  ground-2: "#DEE0E2"    # panel step, never separated by shadow
  ink: "#0E0F10"
  ink-2: "#55595F"       # secondary notes only, never running text
  line: "rgba(14,15,16,0.16)"   # hairline for data panels and leader lines (inspo 3)
  accent: "#D9F84A"      # acid highlight (inspo 2), ink text on it
  night: "#121315"       # one dark chapter per page (inspo 1 frame)
  night-ink: "#ECEDEE"

typography:
  display:  { family: "Inter Tight", weight: 500, size: "clamp(56px, 11vw, 188px)", leading: 0.88, tracking: "-0.045em" }
  h2:       { family: "Inter Tight", weight: 500, size: "clamp(36px, 5.2vw, 84px)", leading: 0.95, tracking: "-0.035em" }
  lead:     { family: "Inter Tight", weight: 450, size: "clamp(22px, 2.2vw, 32px)", leading: 1.12, tracking: "-0.02em" }
  body:     { family: "Inter Tight", weight: 400, size: "17px", leading: 1.5 }
  spec:     { family: "JetBrains Mono", weight: 400, size: "12px", leading: 1.6, tracking: "0.02em", case: upper }

layout:
  grid: 12 columns, 24px gutter, 32px outer margin (16px on phones)
  section-gap: 160–200px desktop, 96px phone
  media: square corners; transparent renders sit directly on ground; white-background drawings use multiply so they print onto the ground

components:
  button: pill, accent fill, ink text, 44px min height; hover darkens accent one step
  annotation: corner-bracket frame + mono label + 1px leader line, only on real features with real numbers
  data-panel: hairline box, mono title, figures in tabular numerals
  index-row: number · title · discipline · year, hairline between rows, image preview on hover

motion:
  entrance: rise 24px + fade, 70ms stagger, once, cubic-bezier(.2,.7,.1,1) 700ms
  signature: hero render drifts on scroll (transform only)
  reduced-motion: all travel removed, content visible

rules (from tasteskill, kept): no gradients, no shadows at rest, no glass, no emoji, no icon cards, headlines ≤ 2 lines, ≤ 2 typefaces, running text in full ink at ≥ 16px, real pictures only.
rules (from tasteskill, overridden by the client's references): monospace spec labels, index numbers and hairline data panels are part of the brief's object-study language and are kept, used only for real data.
