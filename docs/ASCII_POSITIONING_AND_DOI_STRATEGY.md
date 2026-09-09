---
type: positioning
title: "TTEOP — ASCII Positioning and DOI Strategy"
description: "Corrects the 'ASCII of AI efficiency' analogy with historical accuracy, establishes what TTEOP has proven, and defines the DOI-first next sequence for permanent scholarly citation."
tags: [tteop, ascii, doi, zenodo, positioning, strategy]
status: owner-directed
date: 2026-09-04
companion_to:
  - ADOPTION-ROADMAP.md (§"The ASCII moment for AI measurement")
  - ARCHITECTURE-DECISION-MEMO.md (§11 "Should ASCII for AI Efficiency Remain Positioning?")
  - DOI-AND-RELEASE-CITATION-POLICY.md
  - CITATION.cff
---

# TTEOP — ASCII Positioning and DOI Strategy

## What ASCII really was

ASCII means **American Standard Code for Information Interchange**. Technically, it is a 7-bit encoding that assigns numbers to 128 characters and control signals. It was developed through a standards committee, published as ANSI X3.4, and later adopted as the first US Federal Information Processing Standard. That government adoption drove its broad implementation. [NIST's history of ASCII](https://nvlpubs.nist.gov/nistpubs/Legacy/FIPS/fipspub1-2.pdf), [NIST adoption history](https://nvlpubs.nist.gov/nistpubs/sp958-lide/html/172-173.html).

So "the ASCII of AI efficiency" means:

> A small, deterministic, vendor-neutral interchange layer that becomes the common language beneath competing products.

ASCII was not an npm package, DOI, commercial moat, or network protocol. The analogy describes TTEOP's intended architectural role.

## What has been established

| Claim | Status |
|---|---|
| TTEOP is built | **Yes** |
| Canonical implementation within the TTEOP project | **Yes** |
| Public evidence of authorship and release priority | **Yes** |
| Permanent DOI citation | **Not yet** |
| Formal ANSI/ISO standard | **No** |
| Universally adopted industry standard | **No** |

You do **not** need reach, partners, or enterprise adoption to mint the DOI. That is the next move—not Glama.

## The DOI move

Create one Zenodo record named:

> **TTEOP — Token Telemetry Evaluation Operator Protocol: Specification and Reference Implementation, v0.1.3-draft**

The deposit should contain the immutable `e8faaba` release archive, including:

- `SPEC.md`
- JSON schemas
- Metric definitions
- Privacy profiles
- Conformance suite and test vectors
- Governance documents
- Reference implementation
- Release evidence/checksums

Zenodo automatically registers a DOI when a record is published. The DOI provides a permanent location, globally indexed metadata, and correctly attributed citations. [Zenodo DOI documentation](https://help.zenodo.org/docs/deposit/describe-records/reserve-doi/).

Use this sequence:

1. Add a validated `CITATION.cff` identifying you as the creator and specifying `v0.1.3-draft`. GitHub will then display a formal citation. [Zenodo citation metadata guidance](https://help.zenodo.org/docs/github/describe-software/citation-file/).
2. Create a manual Zenodo software deposit for the existing `v0.1.3-draft` archive.
3. Reserve the DOI.
4. Put that reserved DOI into the deposit metadata and citation materials.
5. Publish the immutable record.
6. Add the DOI badge and citation to the README, specification, GitHub release and SignalAF standard page.
7. Enable the GitHub–Zenodo integration so later releases are archived automatically. GitHub confirms that Zenodo can archive releases and issue a DOI for each version. [GitHub citation documentation](https://docs.github.com/en/repositories/archiving-a-github-repository/referencing-and-citing-content).

> **Insight:** The DOI should identify the complete protocol release—not merely the npm library. That permanently connects the definition, formulas, schemas, conformance tests, governance and reference code as one citable object.

One boundary matters: a DOI establishes persistent identity, discoverability, citation and priority. It does **not** itself grant exclusivity or formally declare TTEOP an industry standard.

## Corrected next sequence

**DOI first → canonical citation page → MCP/Glama distribution → independent implementations later.**

The artifact is built. Now etch that exact artifact into the scholarly record.

---

## Cross-references

- `ADOPTION-ROADMAP.md` — §"The ASCII moment for AI measurement" (launch narrative)
- `ARCHITECTURE-DECISION-MEMO.md` — §11 "Should ASCII for AI Efficiency Remain Positioning?" (recommendation: use in marketing, use TTEOP in normative docs)
- `DOI-AND-RELEASE-CITATION-POLICY.md` — active DOI policy with approved identifiers
- `CITATION.cff` — GitHub citation file
- `.zenodo.json` — Zenodo deposit metadata
- `TTEOP_SIGNALAF_OPERATIONALIZATION_BUILD_PLAN.md` — operationalization plan (in ello-repo-control)
