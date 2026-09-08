/**
 * lib/replay.mjs — Privacy-preserving deterministic replay for TTEOP traces.
 *
 * HRN-008 (determinism boundaries) + HRN-005 (memory poisoning prevention):
 * Replay allows re-running a recorded TTEOP telemetry trace to verify
 * that metric computation is deterministic and that the envelope validates
 * the same way every time. This is essential for debugging, auditing,
 * and regression testing.
 *
 * Privacy constraints (TTEOP spec §SRP-PRIV-002):
 *   - Replay uses ONLY the structured TTEOP envelope fields (token counts,
 *     metadata, metrics). It NEVER replays prompt text, response text,
 *     source code, repository contents, keystrokes, screen content,
 *     secrets, or direct real-world identity.
 *   - The TTEOP envelope format already excludes these fields by design
 *     (FORBIDDEN_FIELDS in envelope-validator.mjs). Replay operates on
 *     already-validated envelopes, so it cannot introduce forbidden content.
 *   - Replay does NOT re-contact any external service, model, or API.
 *     It is a pure local computation over recorded structured events.
 *
 * Exports:
 *   - recordTrace(envelope, result) — record a (envelope, validation result) pair
 *   - replayTrace(record) — replay a recorded trace and verify determinism
 *   - replayBatch(records) — replay a batch and return per-trace results
 *   - verifyDeterminism(record) — check that replay produces identical results
 */
import {
  validateEnvelope,
  computeMetrics,
  FORBIDDEN_FIELDS,
} from "./envelope-validator.mjs";

/**
 * @typedef {Object} ReplayRecord
 * @property {object} envelope       — the TTEOP envelope (already privacy-safe)
 * @property {object} expectedResult — the validation result from the original run
 * @property {string} recordedAt    — ISO-8601 timestamp of the original run
 * @property {string} [source]      — optional: where the trace was recorded
 */

/**
 * Record a TTEOP trace for later replay.
 *
 * The envelope is checked for forbidden fields before recording (defense
 * in depth — the envelope should already be validated, but this catches
 * any edge case where a forbidden field slipped through).
 *
 * @param {object} envelope — the TTEOP envelope to record
 * @param {object} result — the validation result from the original run
 * @param {object} [opts] — optional: { source }
 * @returns {ReplayRecord} the recorded trace
 * @throws {Error} if the envelope contains any forbidden field
 */
export function recordTrace(envelope, result, opts = {}) {
  // Defense in depth: scan for forbidden fields before recording.
  // The envelope should already be validated, but this catches any
  // edge case where a forbidden field slipped through.
  _assertNoForbiddenFields(envelope, "");

  return {
    envelope: JSON.parse(JSON.stringify(envelope)), // deep clone (no shared refs)
    expectedResult: JSON.parse(JSON.stringify(result)),
    recordedAt: new Date().toISOString(),
    source: opts.source || null,
  };
}

/**
 * Replay a recorded TTEOP trace and return the new validation result.
 *
 * This re-runs validateEnvelope on the recorded envelope. The result
 * should be identical to the expectedResult if computation is deterministic.
 *
 * Privacy: replay operates ONLY on the structured envelope fields. It does
 * NOT re-contact any model, API, or external service. It is a pure local
 * computation.
 *
 * @param {ReplayRecord} record — the recorded trace
 * @returns {object} the validation result from replay
 */
export function replayTrace(record) {
  // Defense in depth: re-check forbidden fields on replay too.
  _assertNoForbiddenFields(record.envelope, "");

  return validateEnvelope(record.envelope);
}

/**
 * Verify that a replay produces the same result as the original recording.
 *
 * Compares the replayed validation result to the expectedResult in the
 * record. Returns a report with match status and any differences.
 *
 * @param {ReplayRecord} record — the recorded trace
 * @returns {{ deterministic: boolean, differences: string[], replayResult: object }}
 */
export function verifyDeterminism(record) {
  const replayResult = replayTrace(record);
  const differences = _compareResults(record.expectedResult, replayResult);
  return {
    deterministic: differences.length === 0,
    differences,
    replayResult,
  };
}

/**
 * Replay a batch of recorded traces and return per-trace determinism results.
 *
 * @param {ReplayRecord[]} records — the recorded traces
 * @returns {{ allDeterministic: boolean, results: Array }}
 */
export function replayBatch(records) {
  const results = records.map((record, i) => {
    const verification = verifyDeterminism(record);
    return {
      index: i,
      ...verification,
    };
  });
  return {
    allDeterministic: results.every((r) => r.deterministic),
    results,
  };
}

/**
 * Serialize a replay record to JSON for storage.
 * The serialized form contains ONLY structured envelope fields — no
 * prompt text, response text, source code, or other forbidden content.
 *
 * @param {ReplayRecord} record — the recorded trace
 * @returns {string} JSON string
 */
export function serializeRecord(record) {
  // Final defense-in-depth check before serialization.
  _assertNoForbiddenFields(record.envelope, "");
  return JSON.stringify(record, null, 2);
}

/**
 * Deserialize a replay record from JSON.
 * Re-checks forbidden fields on load (defense in depth).
 *
 * @param {string} json — JSON string
 * @returns {ReplayRecord} the deserialized record
 * @throws {Error} if the deserialized envelope contains forbidden fields
 */
export function deserializeRecord(json) {
  const record = JSON.parse(json);
  _assertNoForbiddenFields(record.envelope, "");
  return record;
}

// ─── Internal helpers ─────────────────────────────────────────────────────

/**
 * Recursively scan an object for any forbidden field names.
 * Defense in depth: the envelope should already be validated, but this
 * catches any edge case where a forbidden field slipped through.
 *
 * @param {object} obj — the object to scan
 * @param {string} path — current path (for error messages)
 * @throws {Error} if a forbidden field is found
 */
function _assertNoForbiddenFields(obj, path) {
  if (obj === null || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    const fieldPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_FIELDS.includes(key)) {
      throw new Error(
        `Forbidden field '${fieldPath}' found in replay record. ` +
          `TTEOP replay must not contain prompt text, response text, ` +
          `source code, repository contents, keystrokes, screen content, ` +
          `secrets, or direct real-world identity (SRP-PRIV-002).`,
      );
    }
    if (typeof obj[key] === "object" && obj[key] !== null) {
      _assertNoForbiddenFields(obj[key], fieldPath);
    }
  }
}

/**
 * Compare two validation results for determinism.
 * Compares the fields that should be deterministic: valid, errors, metrics.
 *
 * @param {object} expected — the original result
 * @param {object} actual — the replayed result
 * @returns {string[]} list of differences (empty if identical)
 */
function _compareResults(expected, actual) {
  const differences = [];

  if ((expected?.valid ?? false) !== (actual?.valid ?? false)) {
    differences.push(
      `valid: expected ${expected?.valid}, got ${actual?.valid}`,
    );
  }

  // Compare schema errors (sorted for stable comparison)
  const expSchema = JSON.stringify([...(expected?.schemaErrors || [])].sort());
  const actSchema = JSON.stringify([...(actual?.schemaErrors || [])].sort());
  if (expSchema !== actSchema) {
    differences.push("schemaErrors differ");
  }

  // Compare semantic errors (sorted)
  const expSemantic = JSON.stringify([...(expected?.semanticErrors || [])].sort());
  const actSemantic = JSON.stringify([...(actual?.semanticErrors || [])].sort());
  if (expSemantic !== actSemantic) {
    differences.push("semanticErrors differ");
  }

  // Compare metrics (rounded for stable comparison)
  const expMetrics = JSON.stringify(expected?.metrics || null);
  const actMetrics = JSON.stringify(actual?.metrics || null);
  if (expMetrics !== actMetrics) {
    differences.push("metrics differ");
  }

  return differences;
}
