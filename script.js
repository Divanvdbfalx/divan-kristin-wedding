const countdownTargets = document.querySelectorAll("[data-countdown]");
const weddingDate = new Date("2026-11-28T15:00:00+02:00");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const rsvpForm = document.querySelector(".rsvp-form");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxCaption = lightbox.querySelector("p");
const meatOption = document.querySelector('[data-confetti="meat"]');
const vegOption = document.querySelector('[data-confetti="veg"]');
let lastConfettiLaunch = 0;

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

const launchButtonBurst = (originElement, options = {}) => {
  const now = Date.now();
  if (now - lastConfettiLaunch < 150) {
    return;
  }

  lastConfettiLaunch = now;
  const origin = originElement.nextElementSibling || originElement;
  const rect = origin.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  layer.setAttribute("aria-hidden", "true");

  const colors = ["#a88962", "#68745e", "#b8916f", "#d6c5a5", "#9a6d4e", "#3f4639"];
  const count = options.emoji ? 48 : 70;

  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("span");
    piece.style.setProperty("--origin-x", `${rect.left + rect.width / 2}px`);
    piece.style.setProperty("--origin-y", `${rect.top + rect.height / 2}px`);
    piece.style.setProperty("--tx", `${Math.random() * 420 - 210}px`);
    piece.style.setProperty("--rise", `${Math.random() * -260 - 80}px`);
    piece.style.setProperty("--fall", `${Math.random() * 260 + 250}px`);
    piece.style.setProperty("--delay", `${Math.random() * 0.08}s`);
    piece.style.setProperty("--duration", `${1.9 + Math.random() * 0.7}s`);
    piece.style.setProperty("--spin", `${Math.random() * 900 + 360}deg`);

    if (options.emoji) {
      piece.className = "emoji-piece";
      piece.textContent = options.emoji;
    } else {
      piece.style.background = colors[index % colors.length];
    }

    layer.append(piece);
  }

  document.body.append(layer);
  window.setTimeout(() => layer.remove(), 3400);
};

const bindBurstOption = (option, burstOptions) => {
  option?.closest("label")?.addEventListener("click", () => {
    window.setTimeout(() => {
      if (option.checked) {
        launchButtonBurst(option, burstOptions);
      }
    }, 80);
  });

  option?.addEventListener("change", () => {
    if (option.checked) {
      launchButtonBurst(option, burstOptions);
    }
  });
};

bindBurstOption(meatOption);
bindBurstOption(vegOption, { emoji: "🥦" });

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
