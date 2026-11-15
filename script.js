const countdownTargets = document.querySelectorAll("[data-countdown]");
const weddingDate = new Date("2026-11-28T15:00:00+02:00");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxCaption = lightbox.querySelector("p");

const updateCountdown = () => {
  const remaining = Math.max(weddingDate - new Date(), 0);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const values = {
    days: String(days).padStart(3, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };

  countdownTargets.forEach((target) => {
    target.textContent = values[target.dataset.countdown];
  });
};

const closeMenu = () => {
  document.body.classList.remove("nav-open");
  menuToggle.setAttribute("aria-expanded", "false");
};

menuToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

const closeLightbox = () => {
  lightbox.hidden = true;
  lightboxImage.src = "";
};

document.querySelectorAll("[data-full-image]").forEach((item) => {
  item.addEventListener("click", () => {
    lightboxImage.src = item.dataset.fullImage;
    lightboxImage.alt = item.dataset.caption;
    lightboxCaption.textContent = item.dataset.caption;
    lightbox.hidden = false;
  });
});

document.querySelector(".lightbox-close").addEventListener("click", closeLightbox);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

const stayModal = document.querySelector(".stay-modal");
const stayTrigger = document.querySelector("[data-open-stay]");

const closeStayModal = () => {
  stayModal.hidden = true;
  document.body.classList.remove("nav-open");
  stayTrigger.focus();
};

if (stayModal && stayTrigger) {
  stayTrigger.addEventListener("click", () => {
    stayModal.hidden = false;
    // hergebruik nav-open sodat die bladsy agter die venster nie saamskuif nie
    document.body.classList.add("nav-open");
    stayModal.querySelector(".stay-close").focus();
    stayModal.querySelector(".stay-body").scrollTop = 0;
  });

  stayModal.querySelector(".stay-close").addEventListener("click", closeStayModal);

  stayModal.addEventListener("click", (event) => {
    if (event.target === stayModal) {
      closeStayModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    if (!lightbox.hidden) {
      closeLightbox();
    }
    if (stayModal && !stayModal.hidden) {
      closeStayModal();
    }
  }
});

if (window.lucide) {
  window.lucide.createIcons();
}

updateCountdown();
setInterval(updateCountdown, 1000);
