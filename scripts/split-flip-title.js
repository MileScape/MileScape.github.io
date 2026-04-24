(function () {
    const titles = Array.from(document.querySelectorAll("[data-split-flip-title]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const duration = 750;
    const staggerStep = 150;
    const loopDelay = 350;
    const easing = "cubic-bezier(0.45, 0, 0.55, 1)";
    let resizeFrame = null;

    if (!titles.length || typeof Element.prototype.animate !== "function") {
        return;
    }

    function getSourceText(title) {
        if (!Object.prototype.hasOwnProperty.call(title.dataset, "splitSource")) {
            title.dataset.splitSource = title.textContent || "";
        }

        return title.dataset.splitSource;
    }

    function stopAnimations(title) {
        const animations = title._splitFlipAnimations || [];
        animations.forEach(function (animation) {
            animation.cancel();
        });
        title._splitFlipAnimations = [];
    }

    function buildTitle(title) {
        if (title.dataset.splitReady === "true") {
            return;
        }

        const sourceText = getSourceText(title);
        const accessibleLabel = sourceText.replace(/\s+/g, " ").trim();
        const fragment = document.createDocumentFragment();

        title.textContent = "";
        title.classList.add("is-split-ready");

        if (accessibleLabel) {
            title.setAttribute("aria-label", accessibleLabel);
        }

        Array.from(sourceText).forEach(function (char) {
            const glyph = char === " " ? "\u00A0" : char;
            const wrapper = document.createElement("span");
            const stack = document.createElement("span");
            const top = document.createElement("span");
            const bottom = document.createElement("span");

            wrapper.className = "split-flip-char";
            wrapper.setAttribute("aria-hidden", "true");
            stack.className = "split-flip-stack";
            top.className = "split-flip-glyph";
            bottom.className = "split-flip-glyph";

            top.textContent = glyph;
            bottom.textContent = glyph;

            stack.appendChild(top);
            stack.appendChild(bottom);
            wrapper.appendChild(stack);
            fragment.appendChild(wrapper);
        });

        title.appendChild(fragment);
        title.dataset.splitReady = "true";
    }

    function measureTitle(title) {
        const stacks = Array.from(title.querySelectorAll(".split-flip-stack"));

        stacks.forEach(function (stack) {
            const wrapper = stack.parentElement;
            const face = stack.firstElementChild;
            const faceHeight = face.getBoundingClientRect().height;

            wrapper.style.height = faceHeight + "px";
            stack.dataset.shiftY = String(faceHeight);
        });
    }

    function animateTitle(title) {
        const stacks = Array.from(title.querySelectorAll(".split-flip-stack"));
        const center = (stacks.length - 1) / 2;
        const maxDelay = stacks.reduce(function (maxValue, _, index) {
            return Math.max(maxValue, Math.abs(index - center) * staggerStep);
        }, 0);
        const cycleDuration = maxDelay + duration + loopDelay;

        stopAnimations(title);

        title._splitFlipAnimations = stacks.map(function (stack, index) {
            const delay = Math.abs(index - center) * staggerStep;
            const startOffset = cycleDuration === 0 ? 0 : delay / cycleDuration;
            const endOffset = cycleDuration === 0 ? 1 : (delay + duration) / cycleDuration;
            const shiftY = Number(stack.dataset.shiftY) || 0;

            return stack.animate([
                { transform: "translateY(0px)", offset: 0 },
                { transform: "translateY(0px)", offset: startOffset },
                { transform: "translateY(-" + shiftY + "px)", offset: endOffset },
                { transform: "translateY(-" + shiftY + "px)", offset: 1 }
            ], {
                duration: cycleDuration,
                easing: easing,
                fill: "both",
                iterations: Infinity
            });
        });
    }

    function restoreTitle(title) {
        stopAnimations(title);
        title.textContent = getSourceText(title);
        title.classList.remove("is-split-ready");
        title.removeAttribute("aria-label");
        delete title.dataset.splitReady;
    }

    function syncTitles() {
        if (reducedMotion.matches) {
            titles.forEach(restoreTitle);
            return;
        }

        titles.forEach(function (title) {
            buildTitle(title);
            measureTitle(title);
            animateTitle(title);
        });
    }

    function queueSync() {
        if (resizeFrame !== null) {
            window.cancelAnimationFrame(resizeFrame);
        }

        resizeFrame = window.requestAnimationFrame(function () {
            syncTitles();
            resizeFrame = null;
        });
    }

    syncTitles();
    window.addEventListener("load", queueSync);
    window.addEventListener("resize", queueSync);

    if (document.fonts && typeof document.fonts.ready === "object") {
        document.fonts.ready.then(queueSync);
    }

    if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", syncTitles);
    } else if (typeof reducedMotion.addListener === "function") {
        reducedMotion.addListener(syncTitles);
    }
}());
