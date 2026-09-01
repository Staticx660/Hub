/* Strips account-identifying fields from records before they leave the backend.

   Base44 stamps every record with `created_by` (the creator's real account
   email) and `created_by_id`. CAD lookups are shared across every unit, so
   those fields would expose a player's real email/user id to anyone running a
   search. Nothing in the UI needs them, so they never get sent. */

const ACCOUNT_FIELDS = ['created_by', 'created_by_id', 'owner_user_id'];

export function stripAccountFields(input) {
  if (Array.isArray(input)) return input.map(stripAccountFields);
  if (!input || typeof input !== 'object') return input;
  const out = { ...input };
  for (const f of ACCOUNT_FIELDS) delete out[f];
  return out;
}

/* Same, applied to every value of an object of record lists. */
export function stripAccountFieldsDeep(payload) {
  const out = {};
  for (const [k, v] of Object.entries(payload)) out[k] = stripAccountFields(v);
  return out;
}