document.addEventListener("DOMContentLoaded", () => {
  function initCustomCheckmarks() {
    // Radio
    document
      .querySelectorAll('.checkbox-block input[type="radio"]')
      .forEach((input) => {
        input.addEventListener("change", () => {
          document
            .querySelectorAll(`.checkbox-block input[name="${input.name}"]`)
            .forEach((r) => {
              const mark = r.nextElementSibling;
              if (mark?.classList.contains("checkmark"))
                mark.classList.remove("checked");
            });
          const mark = input.nextElementSibling;
          if (mark?.classList.contains("checkmark"))
            mark.classList.add("checked");
        });
      });
    document.querySelectorAll('.radio input[type="radio"]').forEach((input) => {
      input.addEventListener("change", () => {
        document
          .querySelectorAll(`.radio input[name="${input.name}"]`)
          .forEach((r) => {
            const mark = r.nextElementSibling;
            if (mark?.classList.contains("checkmark"))
              mark.classList.remove("checked");
          });
        const mark = input.nextElementSibling;
        if (mark?.classList.contains("checkmark"))
          mark.classList.add("checked");
      });
    });

    // Checkbox
    document
      .querySelectorAll(
        '.checkbox-block input[type="checkbox"], .checkbox-label input[type="checkbox"]',
      )
      .forEach((input) => {
        input.addEventListener("change", () => {
          const mark = input.nextElementSibling;
          if (mark) {
            input.checked
              ? mark.classList.add("checked")
              : mark.classList.remove("checked");
          }
        });
      });
  }
  initCustomCheckmarks();

  // Toggle disabled สำหรับช่องเหตุผลของ radio
  function toggleRegInputs() {
    const incomplete = document.getElementById("regIncomplete").checked;
    const other = document.getElementById("regOther").checked;
    const incompleteInput = document.getElementById("incompleteReason");
    const otherInput = document.getElementById("otherReason");

    incompleteInput.disabled = !incomplete;
    incompleteInput.required = incomplete;
    if (!incomplete) incompleteInput.value = "";

    otherInput.disabled = !other;
    otherInput.required = other;
    if (!other) otherInput.value = "";
  }

  document
    .getElementById("regComplete")
    .addEventListener("change", toggleRegInputs);
  document
    .getElementById("regIncomplete")
    .addEventListener("change", toggleRegInputs);
  document
    .getElementById("regOther")
    .addEventListener("change", toggleRegInputs);
  toggleRegInputs();

  // Signature canvas
  const canvas = document.getElementById("signatureCanvas");
  const ctx = canvas.getContext("2d");
  let drawing = false;

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });
  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  canvas.addEventListener("mouseup", () => (drawing = false));
  canvas.addEventListener("mouseleave", () => (drawing = false));
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    drawing = true;
    const p = getPos(e.touches[0]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (!drawing) return;
    const p = getPos(e.touches[0]);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  canvas.addEventListener("touchend", () => (drawing = false));

  window.clearCanvas = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

  window.openSignatureModal = () => {
    clearCanvas();
    document.getElementById("signatureModal").classList.add("open");
  };

  window.closeSignatureModal = () => {
    document.getElementById("signatureModal").classList.remove("open");
  };

  window.saveSignature = () => {
    const dataURL = canvas.toDataURL("image/png");
    document.getElementById("signatureData").value = dataURL;
    const img = document.getElementById("signaturePrev");
    img.src = dataURL;
    img.style.display = "block";
    document.getElementById("placeholderText").style.display = "none";
    closeSignatureModal();
  };

  document
    .getElementById("signatureModal")
    .addEventListener("click", function (e) {
      if (e.target === this) closeSignatureModal();
    });

  // Export PDF — render ทีละหน้า แล้วรวม jsPDF
  window.exportPDF = async () => {
    const form = document.getElementById("FastTrackForm");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!document.getElementById("signatureData").value) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาลงนาม",
        text: "โปรดลงลายมือชื่อก่อนบันทึก",
        confirmButtonColor: "#1a5276",
      });
      return;
    }

    const btn = document.getElementById("saveBtn");
    btn.disabled = true;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> กำลังสร้าง PDF...`;
    btn.style.display = "none";

    document
      .querySelectorAll(".sig-placeholder")
      .forEach((el) => (el.style.display = "none"));
    document
      .querySelectorAll(".bar")
      .forEach((el) => (el.style.display = "none"));

    const styleHack = document.createElement("style");
    styleHack.id = "pdf-hack";
    styleHack.textContent = `.page { box-shadow: none !important; margin: 0 !important; }`;
    document.head.appendChild(styleHack);

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });
      const A4_W = 210;
      const A4_H = 297;
      const pages = document.querySelectorAll(".page");

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const cvs = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          width: page.scrollWidth,
          height: page.scrollHeight,
          windowWidth: page.scrollWidth,
        });

        const imgData = cvs.toDataURL("image/jpeg", 0.95);
        const imgH = A4_W * (cvs.height / cvs.width);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, A4_W, Math.min(imgH, A4_H));
      }

      pdf.save("ใบสมัคร Fast Track.pdf");
      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: "ไฟล์ PDF ถูกบันทึกแล้ว",
        confirmButtonColor: "#1a5276",
        timer: 2500,
        timerProgressBar: true,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่",
        confirmButtonColor: "#c0392b",
      });
      console.error(err);
    } finally {
      document.getElementById("pdf-hack")?.remove();
      btn.style.display = "flex";
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> บันทึก PDF`;
      document
        .querySelectorAll(".sig-placeholder")
        .forEach((el) => (el.style.display = ""));
      document
        .querySelectorAll(".bar")
        .forEach((el) => (el.style.display = ""));
    }
  };

  // spin animation
  const styleAnim = document.createElement("style");
  styleAnim.textContent = `@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`;
  document.head.appendChild(styleAnim);
});
