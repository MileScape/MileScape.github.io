(function () {
    const trackStage = document.querySelector("[data-track-animation]");

    if (!trackStage) {
        return;
    }

    const svg = trackStage.querySelector(".hero-track-svg");
    const trackPath = trackStage.querySelector(".hero-track-path");
    const car = trackStage.querySelector(".motion-path-car");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const duration = 9000;
    let frameId = null;
    let startTime = null;

    if (!svg || !trackPath || !car) {
        return;
    }

    function placeCar(progress) {
        const totalLength = trackPath.getTotalLength();
        const normalized = ((progress % 1) + 1) % 1;
        const distance = totalLength * normalized;
        const nextDistance = Math.min(totalLength, distance + 2);
        const point = trackPath.getPointAtLength(distance);
        const nextPoint = trackPath.getPointAtLength(nextDistance);
        const viewBox = svg.viewBox.baseVal;
        const scaleX = trackStage.clientWidth / viewBox.width;
        const scaleY = trackStage.clientHeight / viewBox.height;
        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;

        car.style.left = (point.x * scaleX) + "px";
        car.style.top = (point.y * scaleY) + "px";
        car.style.setProperty("--car-rotation", angle + "deg");
    }

    function stopAnimation() {
        if (frameId !== null) {
            window.cancelAnimationFrame(frameId);
            frameId = null;
        }
    }

    function tick(timestamp) {
        if (startTime === null) {
            startTime = timestamp;
        }

        placeCar((timestamp - startTime) / duration);
        frameId = window.requestAnimationFrame(tick);
    }

    function startAnimation() {
        stopAnimation();

        if (reducedMotion.matches) {
            placeCar(0);
            return;
        }

        startTime = null;
        frameId = window.requestAnimationFrame(tick);
    }

    window.addEventListener("resize", function () {
        if (reducedMotion.matches) {
            placeCar(0);
        }
    });

    if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", startAnimation);
    }

    placeCar(0);
    startAnimation();
}());

(function () {
    const hero = document.getElementById("heroSlider");

    if (!hero) {
        return;
    }

    const slides = Array.from(hero.querySelectorAll(".hero-slide"));
    const prevButton = document.getElementById("heroPrev");
    const nextButton = document.getElementById("heroNext");
    const dotsContainer = document.getElementById("heroDots");
    const autoplayDelay = 5000;
    let activeIndex = 0;
    let autoplayId = null;

    function updateHero(index) {
        activeIndex = (index + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle("is-active", slideIndex === activeIndex);
        });

        Array.from(dotsContainer.children).forEach(function (dot, dotIndex) {
            const isActive = dotIndex === activeIndex;
            dot.classList.toggle("is-active", isActive);
            dot.setAttribute("aria-current", isActive ? "true" : "false");
        });
    }

    function restartAutoplay() {
        if (autoplayId !== null) {
            window.clearInterval(autoplayId);
        }

        autoplayId = window.setInterval(function () {
            updateHero(activeIndex + 1);
        }, autoplayDelay);
    }

    slides.forEach(function (_, index) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "hero-dot";
        dot.setAttribute("aria-label", "切换到首页图片 " + (index + 1));
        dot.addEventListener("click", function () {
            updateHero(index);
            restartAutoplay();
        });
        dotsContainer.appendChild(dot);
    });

    prevButton.addEventListener("click", function () {
        updateHero(activeIndex - 1);
        restartAutoplay();
    });

    nextButton.addEventListener("click", function () {
        updateHero(activeIndex + 1);
        restartAutoplay();
    });

    hero.parentElement.addEventListener("mouseenter", function () {
        if (autoplayId !== null) {
            window.clearInterval(autoplayId);
        }
    });

    hero.parentElement.addEventListener("mouseleave", function () {
        restartAutoplay();
    });

    updateHero(0);
    restartAutoplay();
}());

(function () {
    const nav = document.querySelector(".apple-nav");
    const hero = document.querySelector(".hero-card");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!nav) {
        return;
    }

    const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const sections = navLinks
        .map(function (link) {
            const id = link.getAttribute("href");
            return id ? document.querySelector(id) : null;
        })
        .filter(Boolean);

    if (!sections.length) {
        return;
    }

    function getNavOffset() {
        return nav.getBoundingClientRect().height + 28;
    }

    function setActiveLink(activeId) {
        navLinks.forEach(function (link) {
            const isActive = activeId && link.getAttribute("href") === "#" + activeId;
            link.classList.toggle("is-active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    function getActiveSectionId() {
        const navOffset = getNavOffset();
        const threshold = navOffset + 12;
        const firstSectionTop = sections[0].getBoundingClientRect().top;

        if (firstSectionTop > threshold) {
            return null;
        }

        let currentSectionId = sections[0].id;

        sections.forEach(function (section) {
            if (section.getBoundingClientRect().top <= threshold) {
                currentSectionId = section.id;
            }
        });

        return currentSectionId;
    }

    let syncFrame = 0;
    let suppressScrollSync = false;
    let releaseScrollSyncTimer = 0;

    function syncByScrollPosition() {
        if (syncFrame) {
            window.cancelAnimationFrame(syncFrame);
        }

        syncFrame = window.requestAnimationFrame(function () {
            syncFrame = 0;

            if (suppressScrollSync) {
                return;
            }

            setActiveLink(getActiveSectionId());
        });
    }

    function releaseScrollLockSoon() {
        window.clearTimeout(releaseScrollSyncTimer);
        releaseScrollSyncTimer = window.setTimeout(function () {
            suppressScrollSync = false;
            syncByScrollPosition();
        }, 420);
    }

    function scrollToSection(section, historyMode, behavior) {
        if (!section) {
            return;
        }

        suppressScrollSync = true;
        setActiveLink(section.id);

        const targetTop = Math.max(0, window.scrollY + section.getBoundingClientRect().top - getNavOffset());
        const nextHash = "#" + section.id;

        if (historyMode === "push" && window.location.hash !== nextHash) {
            window.history.pushState(null, "", nextHash);
        } else if (historyMode === "replace") {
            window.history.replaceState(null, "", nextHash);
        }

        window.scrollTo({
            top: targetTop,
            behavior: behavior || (prefersReducedMotion.matches ? "auto" : "smooth")
        });

        releaseScrollLockSoon();
    }

    navLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            const targetId = link.getAttribute("href");
            const targetSection = targetId ? document.querySelector(targetId) : null;

            if (!targetSection) {
                return;
            }

            event.preventDefault();
            scrollToSection(targetSection, "push");
        });
    });

    function syncFromHash() {
        const hash = window.location.hash;
        const targetSection = hash ? document.querySelector(hash) : null;

        if (targetSection) {
            scrollToSection(targetSection, "replace", "auto");
            return;
        }

        syncByScrollPosition();
    }

    window.addEventListener("load", syncFromHash);
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("scroll", syncByScrollPosition, { passive: true });
    window.addEventListener("resize", syncByScrollPosition);
    syncByScrollPosition();

    if (hero) {
        function syncNavSurface() {
            const heroBottom = hero.getBoundingClientRect().bottom;
            const navBottom = nav.getBoundingClientRect().bottom + 16;
            nav.classList.toggle("nav-solid", heroBottom <= navBottom);
        }

        window.addEventListener("load", syncNavSurface);
        window.addEventListener("resize", syncNavSurface);
        window.addEventListener("scroll", syncNavSurface, { passive: true });
        syncNavSurface();
    }
}());

(function () {
    const journeyMaps = Array.from(document.querySelectorAll(".journey-map-scroll"));

    if (!journeyMaps.length) {
        return;
    }

    function getCleanText(node) {
        return node ? node.textContent.replace(/\s+/g, " ").trim() : "";
    }

    function createStageBlock(label, html, modifierClass) {
        const block = document.createElement("div");
        block.className = "journey-stage-block";

        if (modifierClass) {
            block.classList.add(modifierClass);
        }

        const labelNode = document.createElement("span");
        labelNode.className = "journey-stage-label";
        labelNode.textContent = label;

        const valueNode = document.createElement("div");
        valueNode.className = "journey-stage-value";
        valueNode.innerHTML = html;

        block.appendChild(labelNode);
        block.appendChild(valueNode);

        return block;
    }

    journeyMaps.forEach(function (scrollArea) {
        const grid = scrollArea.querySelector(".grid-map");

        if (!grid) {
            return;
        }

        const children = Array.from(grid.children);
        const stageTitles = [];
        const rows = {};
        let index = 0;

        if (children[index] && children[index].classList.contains("row-label")) {
            index += 1;
        }

        while (children[index] && children[index].classList.contains("stage-header")) {
            stageTitles.push(getCleanText(children[index]));
            index += 1;
        }

        while (index < children.length) {
            const rowLabel = children[index];

            if (!rowLabel || !rowLabel.classList.contains("row-label")) {
                index += 1;
                continue;
            }

            const label = getCleanText(rowLabel);
            index += 1;
            rows[label] = [];

            while (index < children.length && !children[index].classList.contains("row-label")) {
                rows[label].push(children[index]);
                index += 1;
            }
        }

        if (!stageTitles.length) {
            return;
        }

        const emotionLabels = rows["Emotions"] && rows["Emotions"][0]
            ? Array.from(rows["Emotions"][0].querySelectorAll(".emotion-label")).map(getCleanText)
            : [];

        const mobileContainer = document.createElement("div");
        mobileContainer.className = "journey-map-mobile";

        stageTitles.forEach(function (rawTitle, stageIndex) {
            const stageCard = document.createElement("article");
            const stageBadge = document.createElement("div");
            const stageTitle = document.createElement("h4");
            const stageGrid = document.createElement("div");
            const cleanStageTitle = rawTitle.replace(/^\d+\.\s*/, "");

            stageCard.className = "journey-stage-card";
            stageBadge.className = "journey-stage-index";
            stageBadge.textContent = String(stageIndex + 1).padStart(2, "0");

            stageTitle.className = "journey-stage-title";
            stageTitle.textContent = cleanStageTitle || rawTitle;

            stageGrid.className = "journey-stage-grid";

            if (rows["Actions"] && rows["Actions"][stageIndex]) {
                stageGrid.appendChild(createStageBlock("Actions", rows["Actions"][stageIndex].innerHTML));
            }

            if (rows["Thoughts"] && rows["Thoughts"][stageIndex]) {
                stageGrid.appendChild(createStageBlock("Thoughts", rows["Thoughts"][stageIndex].innerHTML));
            }

            if (emotionLabels[stageIndex]) {
                stageGrid.appendChild(createStageBlock("Emotion", "<p>" + emotionLabels[stageIndex] + "</p>", "journey-stage-block--emotion"));
            }

            if (rows["Pain Points"] && rows["Pain Points"][stageIndex]) {
                stageGrid.appendChild(createStageBlock("Pain Point", rows["Pain Points"][stageIndex].innerHTML, "journey-stage-block--pain"));
            }

            if (rows["Opportunities"] && rows["Opportunities"][stageIndex]) {
                stageGrid.appendChild(createStageBlock("Opportunity", rows["Opportunities"][stageIndex].innerHTML, "journey-stage-block--opportunity"));
            }

            stageCard.appendChild(stageBadge);
            stageCard.appendChild(stageTitle);
            stageCard.appendChild(stageGrid);
            mobileContainer.appendChild(stageCard);
        });

        scrollArea.classList.add("is-enhanced-mobile");
        mobileContainer.classList.add("is-ready");
        scrollArea.insertAdjacentElement("afterend", mobileContainer);
    });
}());

(function () {
    function initStackSlider(options) {
        const viewport = document.getElementById(options.viewportId);

        if (!viewport) {
            return;
        }

        const slides = Array.from(viewport.querySelectorAll(".crazy8-slide"));
        const prevButton = document.getElementById(options.prevButtonId);
        const nextButton = document.getElementById(options.nextButtonId);
        const pageIndicator = document.getElementById(options.pageIndicatorId);
        const dotsContainer = document.getElementById(options.dotsContainerId);

        if (!slides.length || !prevButton || !nextButton || !pageIndicator || !dotsContainer) {
            return;
        }

        let activeIndex = 0;

        function updateActiveState(nextIndex) {
            activeIndex = nextIndex;
            pageIndicator.textContent = (activeIndex + 1) + " / " + slides.length;

            slides.forEach(function (slide, index) {
                slide.classList.remove("is-active", "is-prev", "is-next", "is-hidden");

                if (index === activeIndex) {
                    slide.classList.add("is-active");
                } else if (index === (activeIndex + 1) % slides.length) {
                    slide.classList.add("is-prev");
                } else if (index === (activeIndex + 2) % slides.length) {
                    slide.classList.add("is-next");
                } else {
                    slide.classList.add("is-hidden");
                }
            });

            Array.from(dotsContainer.children).forEach(function (dot, index) {
                const isActive = index === activeIndex;
                dot.classList.toggle("is-active", isActive);
                dot.setAttribute("aria-current", isActive ? "true" : "false");
            });
        }

        function scrollToIndex(index) {
            const normalizedIndex = (index + slides.length) % slides.length;
            updateActiveState(normalizedIndex);
        }

        slides.forEach(function (_, index) {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "crazy8-dot";
            dot.setAttribute("aria-label", options.dotLabelPrefix + " " + (index + 1));
            dot.addEventListener("click", function () {
                scrollToIndex(index);
            });
            dotsContainer.appendChild(dot);
        });

        prevButton.addEventListener("click", function () {
            scrollToIndex(activeIndex - 1);
        });

        nextButton.addEventListener("click", function () {
            scrollToIndex(activeIndex + 1);
        });

        viewport.addEventListener("keydown", function (event) {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                scrollToIndex(activeIndex - 1);
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                scrollToIndex(activeIndex + 1);
            }
        });

        scrollToIndex(0);
    }

    initStackSlider({
        viewportId: "crazy8Viewport",
        prevButtonId: "crazy8Prev",
        nextButtonId: "crazy8Next",
        pageIndicatorId: "crazy8PageIndicator",
        dotsContainerId: "crazy8Dots",
        dotLabelPrefix: "Go to sketch"
    });

    initStackSlider({
        viewportId: "highfiViewport",
        prevButtonId: "highfiPrev",
        nextButtonId: "highfiNext",
        pageIndicatorId: "highfiPageIndicator",
        dotsContainerId: "highfiDots",
        dotLabelPrefix: "Go to high-fidelity screen"
    });
}());
