document.getElementById("year").textContent = new Date().getFullYear();

const FOLLOWUPS = {
  restaurant: [
    { id: "menu", label: "Do you want an online menu on your site?", type: "yesno" },
    { id: "ordering", label: "Do you need online ordering or table reservations?", type: "yesno" },
  ],
  retail: [
    { id: "ecommerce", label: "Do you want to sell products online (e-commerce)?", type: "yesno" },
    { id: "productCount", label: "Roughly how many products would you list?", type: "text" },
  ],
  salon: [
    { id: "booking", label: "Do you want online appointment booking?", type: "yesno" },
    { id: "staffCount", label: "How many staff members / service providers do you have?", type: "text" },
  ],
  contractor: [
    { id: "gallery", label: "Do you want a photo gallery of past projects?", type: "yesno" },
    { id: "quoteForm", label: 'Do you want a "Request a Quote" form?', type: "yesno" },
  ],
  professional: [
    { id: "blog", label: "Do you want a blog or resources section?", type: "yesno" },
    { id: "consultBooking", label: "Do you want online booking for consultations?", type: "yesno" },
  ],
  other: [
    { id: "goal", label: "What's the main goal of your website?", type: "text" },
  ],
};

const CATEGORY_LABELS = {
  restaurant: "Restaurant / Café",
  retail: "Retail / Boutique",
  salon: "Salon / Spa",
  contractor: "Contractor / Trades",
  professional: "Professional Services / Consulting",
  other: "Other",
};

const STEP_IDS = ["step-business", "step-followup", "step-general", "step-images", "step-review"];

const state = {
  stepIndex: 0,
  category: "",
  images: { logo: null, photos: [] },
};

const els = {
  authView: document.getElementById("authView"),
  wizardView: document.getElementById("wizardView"),
  doneView: document.getElementById("doneView"),
  logoutBtn: document.getElementById("logoutBtn"),
  loginForm: document.getElementById("loginForm"),
  signupForm: document.getElementById("signupForm"),
  loginError: document.getElementById("loginError"),
  signupError: document.getElementById("signupError"),
  wizardForm: document.getElementById("wizardForm"),
  progress: document.getElementById("progress"),
  followupFields: document.getElementById("followupFields"),
  backBtn: document.getElementById("backBtn"),
  nextBtn: document.getElementById("nextBtn"),
  submitBtn: document.getElementById("submitBtn"),
  reviewSummary: document.getElementById("reviewSummary"),
  logoInput: document.getElementById("logoInput"),
  photosInput: document.getElementById("photosInput"),
  logoThumb: document.getElementById("logoThumb"),
  photosThumb: document.getElementById("photosThumb"),
  uploadError: document.getElementById("uploadError"),
  editBtn: document.getElementById("editBtn"),
};

function showView(view) {
  els.authView.hidden = view !== "auth";
  els.wizardView.hidden = view !== "wizard";
  els.doneView.hidden = view !== "done";
  els.logoutBtn.hidden = view === "auth";
}

// ---------- Auth ----------

document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const isLogin = tab.dataset.tab === "login";
    els.loginForm.hidden = !isLogin;
    els.signupForm.hidden = isLogin;
  });
});

async function api(path, options) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options && options.headers) },
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

els.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.loginError.hidden = true;
  const form = new FormData(els.loginForm);
  try {
    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    await afterAuth();
  } catch (err) {
    els.loginError.textContent = err.message;
    els.loginError.hidden = false;
  }
});

els.signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.signupError.hidden = true;
  const form = new FormData(els.signupForm);
  try {
    await api("/api/signup", {
      method: "POST",
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    await afterAuth();
  } catch (err) {
    els.signupError.textContent = err.message;
    els.signupError.hidden = false;
  }
});

els.logoutBtn.addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" }).catch(() => {});
  location.reload();
});

async function afterAuth() {
  const { submission } = await api("/api/intake");
  if (submission) {
    prefill(submission);
    showView("done");
  } else {
    showView("wizard");
    renderStep();
  }
}

// ---------- Wizard ----------

function renderFollowupFields() {
  const questions = FOLLOWUPS[state.category] || [];
  els.followupFields.innerHTML = questions
    .map((q) => {
      if (q.type === "yesno") {
        return `
          <label>${q.label}
            <span class="yesno-group">
              <label><input type="radio" name="${q.id}" value="yes" required> Yes</label>
              <label><input type="radio" name="${q.id}" value="no"> No</label>
            </span>
          </label>`;
      }
      return `
        <label>${q.label}
          <input type="text" name="${q.id}">
        </label>`;
    })
    .join("");
}

document.querySelector('select[name="category"]').addEventListener("change", (e) => {
  state.category = e.target.value;
  renderFollowupFields();
});

function updateProgress() {
  els.progress.innerHTML = STEP_IDS.map((_, i) => {
    const cls = i < state.stepIndex ? "done" : i === state.stepIndex ? "current" : "";
    return `<span class="${cls}"></span>`;
  }).join("");
}

function renderStep() {
  STEP_IDS.forEach((id, i) => {
    document.getElementById(id).classList.toggle("active", i === state.stepIndex);
  });
  updateProgress();
  els.backBtn.hidden = state.stepIndex === 0;
  const isLast = state.stepIndex === STEP_IDS.length - 1;
  els.nextBtn.hidden = isLast;
  els.submitBtn.hidden = !isLast;
  if (isLast) renderReview();
}

function currentStepEl() {
  return document.getElementById(STEP_IDS[state.stepIndex]);
}

els.nextBtn.addEventListener("click", () => {
  const stepEl = currentStepEl();
  const invalid = stepEl.querySelector(":invalid");
  if (invalid) {
    stepEl.reportValidity ? stepEl.reportValidity() : invalid.reportValidity();
    return;
  }
  if (state.stepIndex < STEP_IDS.length - 1) {
    state.stepIndex += 1;
    renderStep();
  }
});

els.backBtn.addEventListener("click", () => {
  if (state.stepIndex > 0) {
    state.stepIndex -= 1;
    renderStep();
  }
});

function collectAnswers() {
  const data = new FormData(els.wizardForm);
  const answers = {};
  for (const [key, value] of data.entries()) {
    answers[key] = value;
  }
  return answers;
}

function renderReview() {
  const answers = collectAnswers();
  const rows = [
    ["Business name", answers.businessName],
    ["Category", CATEGORY_LABELS[answers.category] || answers.category],
  ];
  (FOLLOWUPS[state.category] || []).forEach((q) => {
    rows.push([q.label, answers[q.id] || "—"]);
  });
  rows.push(
    ["Services", answers.servicesText],
    ["Typical customers", answers.targetCustomers || "—"],
    ["Existing website", answers.existingWebsite === "yes" ? "Yes" : "No"],
    ["Domain", answers.domain || "—"],
    ["Timeline", answers.timeline],
    ["Budget", answers.budget]
  );

  const imagesHtml = `
    ${state.images.logo ? `<dt>Logo</dt><dd class="thumb-row">${thumbHtml(state.images.logo)}</dd>` : ""}
    ${state.images.photos.length ? `<dt>Photos</dt><dd class="thumb-row">${state.images.photos.map(thumbHtml).join("")}</dd>` : ""}
  `;

  els.reviewSummary.innerHTML = `<dl>${rows
    .map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(String(value))}</dd>`)
    .join("")}${imagesHtml}</dl>`;
}

function thumbHtml(url) {
  return `<div class="thumb"><img src="${url}" alt=""></div>`;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

els.wizardForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const answers = collectAnswers();
  els.submitBtn.disabled = true;
  try {
    await api("/api/intake", {
      method: "POST",
      body: JSON.stringify({
        answers,
        images: [...(state.images.logo ? [state.images.logo] : []), ...state.images.photos],
      }),
    });
    showView("done");
  } catch (err) {
    alert(err.message);
  } finally {
    els.submitBtn.disabled = false;
  }
});

els.editBtn.addEventListener("click", () => {
  state.stepIndex = 0;
  showView("wizard");
  renderStep();
});

// ---------- Image uploads ----------

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadFile(file, kind) {
  const MAX_BYTES = 4 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error(`${file.name} is larger than 4MB`);
  }
  const dataBase64 = await fileToBase64(file);
  const { url } = await api("/api/upload", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, contentType: file.type, dataBase64, kind }),
  });
  return url;
}

els.logoInput.addEventListener("change", async () => {
  const file = els.logoInput.files[0];
  if (!file) return;
  els.uploadError.hidden = true;
  els.logoThumb.innerHTML = `<div class="thumb uploading"></div>`;
  try {
    const url = await uploadFile(file, "logo");
    state.images.logo = url;
    els.logoThumb.innerHTML = thumbHtml(url);
  } catch (err) {
    els.uploadError.textContent = err.message;
    els.uploadError.hidden = false;
    els.logoThumb.innerHTML = "";
  }
});

els.photosInput.addEventListener("change", async () => {
  const files = Array.from(els.photosInput.files).slice(0, 6 - state.images.photos.length);
  els.uploadError.hidden = true;
  for (const file of files) {
    const placeholder = document.createElement("div");
    placeholder.className = "thumb uploading";
    els.photosThumb.appendChild(placeholder);
    try {
      const url = await uploadFile(file, "photo");
      state.images.photos.push(url);
      placeholder.outerHTML = thumbHtml(url);
    } catch (err) {
      placeholder.remove();
      els.uploadError.textContent = err.message;
      els.uploadError.hidden = false;
    }
  }
  els.photosInput.value = "";
});

// ---------- Prefill (resuming a saved submission) ----------

function prefill(submission) {
  const { answers, images } = submission;
  if (answers.category) {
    state.category = answers.category;
    document.querySelector('select[name="category"]').value = answers.category;
    renderFollowupFields();
  }
  Object.entries(answers).forEach(([key, value]) => {
    const field = els.wizardForm.elements[key];
    if (!field) return;
    if (field instanceof RadioNodeList) {
      Array.from(field).forEach((el) => { el.checked = el.value === value; });
    } else {
      field.value = value;
    }
  });
  if (images && images.length) {
    state.images.logo = images[0];
    state.images.photos = images.slice(1);
    els.logoThumb.innerHTML = thumbHtml(state.images.logo);
    els.photosThumb.innerHTML = state.images.photos.map(thumbHtml).join("");
  }
}

// ---------- Init ----------

(async function init() {
  try {
    await api("/api/me");
    const { submission } = await api("/api/intake");
    if (submission) {
      prefill(submission);
      showView("done");
    } else {
      showView("wizard");
      renderStep();
    }
  } catch {
    showView("auth");
  }
})();
