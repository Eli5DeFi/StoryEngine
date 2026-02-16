-- Insert Chapter 1 for Voidborne: The Silent Throne
-- Run this in your Supabase SQL editor or via Prisma

-- First, ensure we have a story (if not already created)
INSERT INTO "Story" (id, title, description, genre, status, "createdAt", "updatedAt")
VALUES (
  'voidborne-the-silent-throne',
  'Voidborne: The Silent Throne',
  'A space political saga where reality itself is at stake. Five Great Houses control humanity''s future, but someone has mastered the forbidden art of Stitching—rewriting reality thread by thread. As Heir to House Valdris, you must navigate deadly politics, uncover the truth, and prevent the unraveling of existence itself.',
  'SCIFI',
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert Chapter 1
INSERT INTO "Chapter" (
  id,
  "storyId",
  "chapterNumber",
  title,
  content,
  "generationTime",
  status,
  "createdAt",
  "updatedAt"
)
VALUES (
  'ch01-the-stitch-in-reality',
  'voidborne-the-silent-throne',
  1,
  'The Stitch in Reality',
  '## The Silent Throne - Chapter 1

**Location:** The Grand Conclave, Valdris Station  
**Date:** Year 2847, Standard Galactic Calendar

The observation deck of Valdris Station offered a view that few in the galaxy could claim: the entire Grand Conclave assembled in one place.

Kaelen Valdris stood at the reinforced glass, hands clasped behind her back, watching the five dreadnoughts maintain their uneasy orbit. Each ship represented one of the Great Houses—massive vessels that served as both home and fortress for humanity''s ruling elite.

*House Vor.* The crimson warship bristled with weapons.  
*House Veyron.* Industrial gray, scarred from a thousand mining operations.  
*House Kaelen.* Sleek black, its hull crawling with sensors.  
*House Maris.* White and gold, the banker''s palace.  
*House Seren.* Bio-organic curves of purple and green.

And below them all, her station. *House Valdris.* Holder of the Silent Throne. Master of the Thread.

---

"Heir Valdris." Admiral Zhang Wei emerged from the shadows. "The Conclave convenes in one hour. All five Houses are demanding answers."

"Let them demand." Kaelen didn''t turn from the window. "The Thread is my family''s legacy, not theirs."

"Someone is Stitching," Zhang said quietly. "Reality itself is being altered."

Kaelen''s jaw tightened. *Stitching.* The art of manipulating the Thread—the quantum substrate underlying all reality—had been lost for three hundred years.

"The Houses believe you''re responsible," Zhang continued. "They think Valdris has secretly preserved the Stitching arts."

---

### The Conclave Chamber

The Grand Conclave met in a spherical chamber at the heart of Valdris Station. Five representatives had arrived:

**Lady Elara Vor** (House Vor) - Military commander, hand on her plasma sidearm.  
**Director Cassius Veyron** (House Veyron) - More machine than man.  
**The Watcher** (House Kaelen) - Identity hidden behind a mask.  
**Archon Livia Maris** (House Maris) - Monitoring financial flows across star systems.  
**Doctor Phaedra Seren** (House Seren) - Barely human anymore.  
**Captain Reyes** - Independent operator, neutral observer.

"Three hundred years your House has held the Silent Throne," Lady Vor said. "Yet now reality fractures around us. Explain."

"House Valdris did not cause this," Kaelen replied.

"Then how," The Watcher asked, "do our surveillance nets detect Thread activity from this very station?"

Archon Maris spoke: "Markets cannot function when history changes. If this continues, the financial system collapses within six months."

Doctor Seren added: "My patients report memories that don''t belong to them. We''ve had seventeen suicides this month."

Kaelen felt the weight of their stares. "I will find the source. Give me two weeks—"

"Two weeks?" Lady Vor laughed bitterly. "No. The Conclave demands immediate action."

Director Veyron leaned forward. "Open the Vault. Reveal what Valdris has hidden about the Thread."

"And if I refuse?"

Lady Vor''s smile was cold. "Then we will respond accordingly."

A threat. Unmistakable.

---

## What Should Kaelen Do?

**Three choices. One decision. Reality hangs in the balance.**',
  NOW() + INTERVAL ''7 days'',  -- Betting opens for 1 week
  'BETTING',
  NOW(),
  NOW()
);

-- Insert the three choice outcomes
INSERT INTO "Outcome" (
  id,
  "chapterId",
  type,
  description,
  "outcomeText",
  status,
  "createdAt",
  "updatedAt"
)
VALUES
(
  'ch01-choice-a-open-vault',
  'ch01-the-stitch-in-reality',
  'CHOICE',
  'Open the Vault',
  'Kaelen opens the Blood-Locked Vault, revealing the Thread archives to all five Houses. Shows cooperation but risks exposing Valdris secrets. Gains trust from Maris & Seren, risks theft by Kaelen & Veyron, Vor sees weakness.',
  'PENDING',
  NOW(),
  NOW()
),
(
  'ch01-choice-b-negotiate-rebels',
  'ch01-the-stitch-in-reality',
  'CHOICE',
  'Negotiate with Rebels',
  'Kaelen reveals an underground movement experimenting with Thread fragments. Proposes using them to investigate, buying time and deflecting blame. Divides the Conclave, brings rebels into play, keeps secrets safe.',
  'PENDING',
  NOW(),
  NOW()
),
(
  'ch01-choice-c-seal-station',
  'ch01-the-stitch-in-reality',
  'CHOICE',
  'Seal the Station',
  'Kaelen declares total lockdown—no one leaves or enters. She will find the Stitcher herself. Aggressive move that risks war but forces the culprit to act. Shows strength but risks everything.',
  'PENDING',
  NOW(),
  NOW()
);

-- Schedule chapter for generation (7 days from now)
-- Betting deadline will be 6 days from now (1 hour before generation)

COMMIT;
