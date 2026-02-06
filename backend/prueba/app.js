const API_BASE = "http://localhost:3000"; // ajusta si usas BASE_PATH

const params = new URLSearchParams(window.location.search);
const userId = params.get("user");
const courseId = params.get("course_id");
const prefix = params.get("prefix");

const assignmentsSelect = document.getElementById("assignments");
const output = document.getElementById("output");
const submitBtn = document.getElementById("submitBtn");
const fileInput = document.getElementById("fileInput");

document.getElementById("info").innerText =
  `Usuario: ${userId} | Curso: ${courseId}`;

async function loadAssignments() {
  const res = await fetch(`${API_BASE}/assignments/enriched`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseId, prefix, userId })
  });

  const data = await res.json();

  assignmentsSelect.innerHTML = data.assignments
    .map(a =>
      `<option value="${a.id}">
        ${a.name} (${a.submissionstatus || "sin estado"})
      </option>`
    )
    .join("");
}

async function getDraftItemId() {
  const res = await fetch(`${API_BASE}/get-draft-itemid`);
  const data = await res.json();
  return data.itemid;
}

async function uploadDraftFile(itemId, file) {
  const form = new FormData();
  form.append("file", file);
  form.append("itemid", itemId);

  const res = await fetch(`${API_BASE}/upload-draft-file`, {
    method: "POST",
    body: form
  });

  return await res.json();
}

async function submitAssignment() {
  try {
    const assignmentId = assignmentsSelect.value;
    const file = fileInput.files[0];
    if (!file) return alert("Selecciona un archivo");

    output.textContent = "⏳ Subiendo archivo...";

    const itemId = await getDraftItemId();
    await uploadDraftFile(itemId, file);

    output.textContent = "📨 Enviando entrega...";

    const res = await fetch(`${API_BASE}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId,
        itemId,
        userId,
        userName: `User${userId}`,
        courseId
      })
    });

    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);

    loadAssignments();
  } catch (err) {
    output.textContent = "❌ Error: " + err.message;
  }
}

submitBtn.addEventListener("click", submitAssignment);

loadAssignments();
