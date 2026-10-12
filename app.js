const SUPABASE_URL = "https://xfizzpzjimkqeofrirrv.supabase.co";
const SUPABASE_KEY = "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";
const BUCKET = "Vaayana-audio";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function wordPath(word) {
  const bytes = new TextEncoder().encode(word.normalize("NFC").trim().toLowerCase());
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  const safe = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return "words/" + safe + ".audio";
}
async function currentRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("vm_roles").select("role").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return data?.role || null;
}
async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}
async function signOut() { return await supabase.auth.signOut(); }
async function loadCards() {
  const { data, error } = await supabase.from("vm_cards").select("*").order("position");
  if (error) throw error;
  return data || [];
}
async function saveCard(card) { return await supabase.from("vm_cards").upsert(card); }
async function deleteCard(id) { return await supabase.from("vm_cards").delete().eq("id", id); }
async function playWord(word, statusEl) {
  statusEl.textContent = "ഓഡിയോ ലോഡ് ചെയ്യുന്നു…";
  const { data, error } = await supabase.storage.from(BUCKET).download(wordPath(word));
  if (error) { statusEl.textContent = "ഓഡിയോ ലഭ്യമല്ല. അധ്യാപകൻ റെക്കോർഡ് ചെയ്തിട്ടുണ്ടോ എന്ന് പരിശോധിക്കുക."; return; }
  const url = URL.createObjectURL(data);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  statusEl.textContent = "";
  try { await audio.play(); } catch(e) { statusEl.textContent = "ഓഡിയോ പ്ലേ ചെയ്യാൻ വീണ്ടും അമർത്തുക."; }
}
async function uploadAudio(word, blob) {
  return await supabase.storage.from(BUCKET).upload(wordPath(word), blob, { contentType: blob.type || "audio/webm", upsert: true });
}
function splitWords(text) { return (text.match(/[\p{L}\p{M}\d]+/gu) || []).filter(Boolean); }
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
