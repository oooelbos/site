document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Smooth anchor scrolling (iOS Safari behaves inconsistently with CSS scroll-behavior)
  const headerEl = document.querySelector("header");
  const getHeaderOffset = () => (headerEl ? headerEl.getBoundingClientRect().height : 0);
  document.addEventListener("click", (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href === "#" || href.length < 2) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();

    const offset = getHeaderOffset() + 10;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: "smooth" });
    history.pushState(null, "", href);
  });

  const modal = document.getElementById("engineer-modal");
  const openButtons = document.querySelectorAll("#open-modal, [data-modal-open]");
  const closeButton = document.getElementById("close-modal");

  const openModal = () => {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
  };

  openButtons.forEach((btn) => btn.addEventListener("click", openModal));
  if (closeButton) closeButton.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  const forms = ["quick-calc-form", "engineer-form"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const quickCalcFilesInput = document.getElementById("quick-calc-files");
  const quickCalcDropzone = document.getElementById("quick-calc-dropzone");
  const quickCalcFilesList = document.getElementById("quick-calc-files-list");
  // FormSubmit: free tier supports uploads, total <= 10MB (sum of files).
  const QUICK_CALC_ALLOW_ATTACHMENTS = true;
  const QUICK_CALC_MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB total

  const formatFileList = (files) => {
    if (!files || files.length === 0) return "";
    const names = [];
    for (let i = 0; i < files.length; i += 1) names.push(files[i].name);
    return names.join(", ");
  };

  const renderQuickCalcFiles = () => {
    if (!quickCalcFilesList) return;
    const files = quickCalcFilesInput && quickCalcFilesInput.files ? quickCalcFilesInput.files : null;
    const text = formatFileList(files);
    if (!text) {
      quickCalcFilesList.textContent = "";
      quickCalcFilesList.classList.add("hidden");
      return;
    }
    quickCalcFilesList.textContent = `Файлы: ${text}`;
    quickCalcFilesList.classList.remove("hidden");
  };

  const getTotalSize = (files) => {
    if (!files || files.length === 0) return 0;
    let total = 0;
    for (let i = 0; i < files.length; i += 1) total += files[i].size || 0;
    return total;
  };

  const validateQuickCalcFiles = (files) => {
    if (!files) return null;
    if (!QUICK_CALC_ALLOW_ATTACHMENTS && files.length > 0) {
      return "Отправка файлов недоступна на бесплатном тарифе. Оставьте контакты без вложений.";
    }
    const totalBytes = getTotalSize(files);
    if (totalBytes > QUICK_CALC_MAX_TOTAL_BYTES) {
      return "Файлы слишком большие. Максимальный общий размер вложений: 10 МБ.";
    }
    return null;
  };

  if (quickCalcFilesInput) {
    quickCalcFilesInput.addEventListener("change", () => {
      const err = validateQuickCalcFiles(quickCalcFilesInput.files);
      if (err) {
        setStatus("quick-calc-status", err, "error");
        quickCalcFilesInput.value = "";
      }
      renderQuickCalcFiles();
    });
  }

  if (quickCalcDropzone && quickCalcFilesInput) {
    const setDragState = (isDragging) => {
      if (isDragging) {
        quickCalcDropzone.classList.add("border-brand-400/80", "bg-black/45");
      } else {
        quickCalcDropzone.classList.remove("border-brand-400/80", "bg-black/45");
      }
    };

    ["dragenter", "dragover"].forEach((evt) => {
      quickCalcDropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragState(true);
      });
    });

    ["dragleave", "dragend"].forEach((evt) => {
      quickCalcDropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragState(false);
      });
    });

    quickCalcDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState(false);
      const dt = e.dataTransfer;
      if (!dt || !dt.files) return;
      quickCalcFilesInput.files = dt.files;
      const err = validateQuickCalcFiles(quickCalcFilesInput.files);
      if (err) {
        setStatus("quick-calc-status", err, "error");
        quickCalcFilesInput.value = "";
      }
      renderQuickCalcFiles();
    });
  }

  const setStatus = (id, text, tone) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.remove("hidden");
    el.classList.toggle("text-green-300", tone === "ok");
    el.classList.toggle("text-red-300", tone === "error");
    el.classList.toggle("text-slate-300", tone === "info");
  };

  const submitToEndpoint = async (form, statusId) => {
    const action = form.getAttribute("action");
    if (!action) throw new Error("No form action URL");

    const formData = new FormData(form);
    const res = await fetch(action, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    if (res.ok) return;
    let msg = "Не удалось отправить. Попробуйте еще раз.";
    try {
      const data = await res.json();
      if (data && data.errors && data.errors.length) {
        msg = data.errors.map((e) => e.message).join("; ");
      }
    } catch (_) {
      // ignore
    }
    setStatus(statusId, msg, "error");
    throw new Error(msg);
  };

  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const isEngineer = form.id === "engineer-form";
      const statusId = isEngineer ? "engineer-status" : "quick-calc-status";

      if (!isEngineer && quickCalcFilesInput && quickCalcFilesInput.files) {
        const err = validateQuickCalcFiles(quickCalcFilesInput.files);
        if (err) {
          setStatus(statusId, err, "error");
          return;
        }
      }

      setStatus(statusId, "Отправляем…", "info");

      submitToEndpoint(form, statusId)
        .then(() => {
          setStatus(statusId, "Отправлено. Мы свяжемся с вами.", "ok");
          form.reset();
          if (!isEngineer && quickCalcFilesInput) {
            quickCalcFilesInput.value = "";
            renderQuickCalcFiles();
          }
          if (isEngineer) closeModal();
        })
        .catch(() => {
          // status already set
        });
    });
  });
});

