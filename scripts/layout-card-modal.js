(function () {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const baseSelector = ".inner-card";
    const excludedSelector = "a[href], button, input, select, textarea, summary, table, .crazy8-slider";
    const cards = Array.from(document.querySelectorAll(baseSelector)).filter(function (card) {
        return !card.querySelector(excludedSelector);
    });

    let activeCard = null;
    let activeClone = null;
    let isTransitioning = false;
    let lockedScrollX = 0;
    let lockedScrollY = 0;
    let previousBodyPaddingRight = "";

    if (!cards.length || typeof Element.prototype.animate !== "function") {
        return;
    }

    const modal = document.createElement("div");
    modal.id = "layout-dialog";
    modal.className = "layout-dialog";
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
        '<div class="layout-dialog-overlay" data-layout-overlay></div>',
        '<div class="layout-dialog-frame" data-layout-frame role="dialog" aria-modal="true" aria-label="Expanded card">',
        '    <button class="layout-dialog-close" type="button" aria-label="Close expanded card">Close</button>',
        '    <div class="layout-dialog-copy" data-layout-copy></div>',
        "</div>"
    ].join("");
    document.body.appendChild(modal);

    const overlay = modal.querySelector("[data-layout-overlay]");
    const frame = modal.querySelector("[data-layout-frame]");
    const copy = modal.querySelector("[data-layout-copy]");
    const closeButton = modal.querySelector(".layout-dialog-close");

    function getCardLabel(card) {
        const labelNode = card.querySelector(".card-title, h3, .member-name, strong");
        const text = labelNode ? labelNode.textContent || "" : "";
        const normalized = text.replace(/\s+/g, " ").trim();

        return normalized || "Expanded card";
    }

    function isInteractiveTarget(target) {
        return Boolean(target.closest("a[href], button, input, select, textarea, summary"));
    }

    function sanitizeClone(card) {
        const clone = card.cloneNode(true);

        clone.classList.remove("layout-expandable-card", "is-layout-open");
        clone.removeAttribute("tabindex");
        clone.removeAttribute("role");
        clone.removeAttribute("aria-haspopup");
        clone.removeAttribute("aria-expanded");
        clone.removeAttribute("aria-label");
        clone.querySelectorAll("[id]").forEach(function (node) {
            node.removeAttribute("id");
        });
        clone.querySelectorAll("[aria-controls]").forEach(function (node) {
            node.removeAttribute("aria-controls");
        });

        return clone;
    }

    function getTransitionDuration(fromRect, toRect) {
        const distance = Math.hypot(toRect.left - fromRect.left, toRect.top - fromRect.top);
        const sizeShift = Math.abs(toRect.width - fromRect.width) + Math.abs(toRect.height - fromRect.height);

        return Math.round(Math.min(760, Math.max(420, 260 + distance * 0.32 + sizeShift * 0.11)));
    }

    function getTransform(fromRect, toRect) {
        const translateX = fromRect.left - toRect.left;
        const translateY = fromRect.top - toRect.top;
        const scaleX = toRect.width === 0 ? 1 : fromRect.width / toRect.width;
        const scaleY = toRect.height === 0 ? 1 : fromRect.height / toRect.height;

        return "translate3d(" + translateX + "px, " + translateY + "px, 0px) scale(" + scaleX + ", " + scaleY + ")";
    }

    function getAnimatableChildren(root) {
        return Array.from(root.querySelectorAll("h2, h3, p, img, li, .persona-quote, .media-panel, .media-grid > *, .avatar-placeholder, .member-role, .member-desc, .impact-number")).slice(0, 18);
    }

    function lockPageScroll() {
        const computedPaddingRight = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
        const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);

        lockedScrollX = window.scrollX || window.pageXOffset || 0;
        lockedScrollY = window.scrollY || window.pageYOffset || 0;
        previousBodyPaddingRight = document.body.style.paddingRight;
        document.body.style.paddingRight = computedPaddingRight + scrollbarWidth + "px";
        document.body.classList.add("has-layout-dialog");
    }

    function unlockPageScroll() {
        document.body.classList.remove("has-layout-dialog");
        document.body.style.paddingRight = previousBodyPaddingRight;
        window.scrollTo(lockedScrollX, lockedScrollY);
    }

    function animateOverlay(opening, duration) {
        return overlay.animate([
            { opacity: opening ? 0 : 1 },
            { opacity: opening ? 1 : 0 }
        ], {
            duration: Math.max(220, duration * 0.78),
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both"
        });
    }

    function animateChildrenIn(root, duration) {
        return getAnimatableChildren(root).map(function (node, index) {
            return node.animate([
                { opacity: 0, transform: "translateY(20px) scale(0.98)" },
                { opacity: 1, transform: "translateY(0px) scale(1)" }
            ], {
                duration: Math.max(280, duration - 140),
                delay: 110 + index * 22,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "both"
            });
        });
    }

    function showModalShell(label) {
        frame.setAttribute("aria-label", label);
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        modal.classList.add("is-open");
    }

    function hideModalShell() {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        modal.hidden = true;
    }

    function finishClose() {
        const cardToRestore = activeCard;

        hideModalShell();
        copy.textContent = "";
        unlockPageScroll();

        if (cardToRestore) {
            cardToRestore.classList.remove("is-layout-return-target");
            cardToRestore.classList.remove("is-layout-open");
            cardToRestore.setAttribute("aria-expanded", "false");
            cardToRestore.focus({ preventScroll: true });
        }

        activeCard = null;
        activeClone = null;
        isTransitioning = false;
    }

    function closeCard() {
        if (!activeCard || !activeClone || isTransitioning) {
            return;
        }

        const destinationCard = activeCard;
        const modalCard = activeClone;
        const currentRect = modalCard.getBoundingClientRect();
        const destinationRect = destinationCard.getBoundingClientRect();
        const duration = Math.max(300, getTransitionDuration(destinationRect, currentRect) - 10);

        isTransitioning = true;

        if (reducedMotion.matches) {
            finishClose();
            return;
        }

        destinationCard.classList.add("is-layout-return-target");

        const cardAnimation = modalCard.animate([
            {
                transform: "translate3d(0px, 0px, 0px) scale(1, 1)",
                opacity: 1,
                offset: 0
            },
            {
                transform: "translate3d(0px, -6px, 0px) scale(0.996, 0.996)",
                opacity: 1,
                offset: 0.18
            },
            {
                transform: getTransform(destinationRect, currentRect),
                opacity: 0.9,
                offset: 1
            }
        ], {
            duration: duration,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both"
        });

        const overlayAnimation = animateOverlay(false, duration);
        const landingAnimation = destinationCard.animate([
            { opacity: 0, transform: "translate3d(0px, 4px, 0px) scale(0.992)" },
            { opacity: 1, transform: "translate3d(0px, 0px, 0px) scale(1)" }
        ], {
            duration: 200,
            delay: Math.max(0, duration - 120),
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both"
        });

        Promise.allSettled([
            cardAnimation.finished,
            overlayAnimation.finished,
            landingAnimation.finished
        ]).finally(finishClose);
    }

    function openCard(card) {
        let modalCard;
        let sourceRect;
        let destinationRect;
        let duration;

        if (activeCard || isTransitioning) {
            return;
        }

        activeCard = card;
        isTransitioning = true;
        copy.textContent = "";
        modalCard = sanitizeClone(card);
        sourceRect = card.getBoundingClientRect();
        copy.appendChild(modalCard);
        activeClone = modalCard;
        lockPageScroll();
        showModalShell(getCardLabel(card));
        copy.scrollTop = 0;
        destinationRect = modalCard.getBoundingClientRect();
        duration = getTransitionDuration(sourceRect, destinationRect);

        if (reducedMotion.matches) {
            overlay.style.opacity = "1";
            card.classList.add("is-layout-open");
            card.setAttribute("aria-expanded", "true");
            isTransitioning = false;
            closeButton.focus({ preventScroll: true });
            return;
        }

        card.classList.add("is-layout-open");
        card.setAttribute("aria-expanded", "true");

        const cardAnimation = modalCard.animate([
            {
                transform: getTransform(sourceRect, destinationRect),
                opacity: 0.82
            },
            {
                transform: "translate3d(0px, 0px, 0px) scale(1, 1)",
                opacity: 1
            }
        ], {
            duration: duration,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both"
        });

        const overlayAnimation = animateOverlay(true, duration);
        const childAnimations = animateChildrenIn(modalCard, duration);

        Promise.allSettled([
            cardAnimation.finished,
            overlayAnimation.finished
        ].concat(childAnimations.map(function (animation) {
            return animation.finished;
        }))).finally(function () {
            isTransitioning = false;
            closeButton.focus({ preventScroll: true });
        });
    }

    cards.forEach(function (card) {
        card.classList.add("layout-expandable-card");
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-haspopup", "dialog");
        card.setAttribute("aria-expanded", "false");
        card.setAttribute("aria-label", getCardLabel(card) + ". Open expanded view.");

        card.addEventListener("click", function (event) {
            if (event.defaultPrevented || isInteractiveTarget(event.target)) {
                return;
            }

            openCard(card);
        });

        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCard(card);
            }
        });
    });

    closeButton.addEventListener("click", closeCard);
    overlay.addEventListener("click", closeCard);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && activeCard && !isTransitioning) {
            event.preventDefault();
            closeCard();
        }
    });
}());
