const countdownTargets = document.querySelectorAll("[data-countdown]");
const weddingDate = new Date("2026-11-28T15:00:00+02:00");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const rsvpForm = document.querySelector(".rsvp-form");
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

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".form-status");
  const name = form.elements.name.value.trim() || "Guest";

  submitButton.disabled = true;
  status.textContent = "Sending your RSVP...";

  try {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Please try again.");
    }

    form.reset();
    status.textContent = `Thank you, ${name}. Your RSVP has been saved.`;
  } catch (error) {
    status.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    if (!lightbox.hidden) {
      closeLightbox();
    }
  }
});

if (window.lucide) {
  window.lucide.createIcons();
}

updateCountdown();
setInterval(updateCountdown, 1000);
