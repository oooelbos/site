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

  if (quickCalcFilesInput) {
    quickCalcFilesInput.addEventListener("change", renderQuickCalcFiles);
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
      renderQuickCalcFiles();
    });
  }

  const sendViaMailClient = (subjectText, bodyText) => {
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:elbos@tut.by?subject=${subject}&body=${body}`;
  };

  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (form.id === "engineer-form") {
        const nameEl = form.elements.namedItem("name");
        const phoneEl = form.elements.namedItem("phone");
        const commentEl = form.elements.namedItem("comment");
        const name = (nameEl && nameEl.value ? nameEl.value : "").trim();
        const phone = (phoneEl && phoneEl.value ? phoneEl.value : "").trim();
        const comment = (commentEl && commentEl.value ? commentEl.value : "").trim();

        sendViaMailClient(
          "Заявка: заказать звонок",
          `Новая заявка на звонок\n\nИмя: ${name}\nТелефон: ${phone}\nКомментарий: ${comment || "-"}`
        );
      } else {
        const nameEl = form.elements.namedItem("name");
        const phoneEl = form.elements.namedItem("phone");
        const systemEl = form.elements.namedItem("system");
        const name = (nameEl && nameEl.value ? nameEl.value : "").trim();
        const phone = (phoneEl && phoneEl.value ? phoneEl.value : "").trim();
        const system = (systemEl && systemEl.value ? systemEl.value : "").trim();
        const filesText = formatFileList(quickCalcFilesInput && quickCalcFilesInput.files ? quickCalcFilesInput.files : null);

        sendViaMailClient(
          "Заявка: рассчитать стоимость",
          `Новая заявка на расчет стоимости\n\nИмя: ${name}\nТелефон: ${phone}\nСистема: ${system || "-"}\nФайлы: ${filesText || "-"}`
        );
      }

      alert("Открылось письмо для отправки на elbos@tut.by. Подтвердите отправку в вашей почтовой программе.");
      form.reset();
      if (form.id === "quick-calc-form" && quickCalcFilesInput) {
        quickCalcFilesInput.value = "";
        renderQuickCalcFiles();
      }
      closeModal();
    });
  });
});

