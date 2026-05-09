(function () {
    var links = Array.prototype.slice.call(document.querySelectorAll(".timeline-frame-link"));

    if (!links.length) {
        return;
    }

    var activeTrigger = null;
    var previousOverflow = "";
    var lightbox = document.createElement("div");
    lightbox.className = "timeline-lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.innerHTML = [
        '<button class="timeline-lightbox__backdrop" type="button" aria-label="Close enlarged timeline image"></button>',
        '<div class="timeline-lightbox__frame" role="dialog" aria-modal="true" aria-label="Timeline image preview">',
        '    <button class="timeline-lightbox__close" type="button" aria-label="Close enlarged timeline image">&times;</button>',
        '    <img class="timeline-lightbox__image" alt="">',
        "</div>"
    ].join("");
    document.body.appendChild(lightbox);

    var image = lightbox.querySelector(".timeline-lightbox__image");
    var backdrop = lightbox.querySelector(".timeline-lightbox__backdrop");
    var closeButton = lightbox.querySelector(".timeline-lightbox__close");

    function openLightbox(trigger) {
        var thumbnail = trigger.querySelector("img");
        var source = trigger.getAttribute("href") || (thumbnail && thumbnail.currentSrc) || "";

        if (!source || !image) {
            return;
        }

        activeTrigger = trigger;
        previousOverflow = document.body.style.overflow;
        image.src = source;
        image.alt = thumbnail ? thumbnail.alt : "";
        lightbox.hidden = false;
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        closeButton.focus();
    }

    function closeLightbox() {
        if (lightbox.hidden) {
            return;
        }

        lightbox.hidden = true;
        lightbox.setAttribute("aria-hidden", "true");
        image.removeAttribute("src");
        document.body.style.overflow = previousOverflow;

        if (activeTrigger) {
            activeTrigger.focus();
        }

        activeTrigger = null;
    }

    links.forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            openLightbox(link);
        });
    });

    backdrop.addEventListener("click", closeLightbox);
    closeButton.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeLightbox();
        }
    });
}());

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
    const moodboard = document.getElementById("interviewMoodboard");

    if (!moodboard) {
        return;
    }

    const items = Array.from(moodboard.querySelectorAll(".scrapbook-item"));
    const prevButton = document.getElementById("interviewMoodboardPrev");
    const nextButton = document.getElementById("interviewMoodboardNext");
    const pageIndicator = document.getElementById("interviewMoodboardPageIndicator");

    if (!items.length || !prevButton || !nextButton || !pageIndicator) {
        return;
    }

    let activeIndex = 0;

    function syncIndicator() {
        const moodboardRect = moodboard.getBoundingClientRect();
        const moodboardCenter = moodboardRect.left + moodboardRect.width / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;

        items.forEach(function (item, index) {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distance = Math.abs(itemCenter - moodboardCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        activeIndex = closestIndex;
        pageIndicator.textContent = (activeIndex + 1) + " / " + items.length;
    }

    function scrollToIndex(index) {
        const normalizedIndex = (index + items.length) % items.length;
        items[normalizedIndex].scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
        });
        activeIndex = normalizedIndex;
        pageIndicator.textContent = (activeIndex + 1) + " / " + items.length;
    }

    let scrollFrame = 0;

    moodboard.addEventListener("scroll", function () {
        if (scrollFrame) {
            window.cancelAnimationFrame(scrollFrame);
        }

        scrollFrame = window.requestAnimationFrame(function () {
            scrollFrame = 0;
            syncIndicator();
        });
    }, { passive: true });

    moodboard.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollToIndex(activeIndex - 1);
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollToIndex(activeIndex + 1);
        }
    });

    prevButton.addEventListener("click", function () {
        scrollToIndex(activeIndex - 1);
    });

    nextButton.addEventListener("click", function () {
        scrollToIndex(activeIndex + 1);
    });

    window.addEventListener("resize", syncIndicator);
    syncIndicator();
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

    initStackSlider({
        viewportId: "profiViewport",
        prevButtonId: "profiPrev",
        nextButtonId: "profiNext",
        pageIndicatorId: "profiPageIndicator",
        dotsContainerId: "profiDots",
        dotLabelPrefix: "Go to Version Pro screen"
    });

}());

(function () {
    const chartRoot = document.querySelector("[data-evaluation-chart]");

    if (!chartRoot) {
        return;
    }

    const barsContainer = chartRoot.querySelector("[data-eval-bars]");
    const buttons = Array.from(chartRoot.querySelectorAll("[data-eval-view]"));
    const caption = chartRoot.querySelector("[data-eval-caption]");
    const summaryValueMap = {
        mileAverage: chartRoot.querySelector('[data-eval-summary="mile-average"]'),
        averageGap: chartRoot.querySelector('[data-eval-summary="average-gap"]'),
        topDimension: chartRoot.querySelector('[data-eval-summary="top-dimension"]')
    };
    const summaryNoteMap = {
        mileAverage: chartRoot.querySelector('[data-eval-summary-note="mile-average"]'),
        averageGap: chartRoot.querySelector('[data-eval-summary-note="average-gap"]'),
        topDimension: chartRoot.querySelector('[data-eval-summary-note="top-dimension"]')
    };
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const datasets = {
        ueqs: {
            label: "UEQ-S",
            description: "User experience quality across 8 semantic differential scales.",
            items: [
                { label: "Supportive", keep: 6.1, mile: 6.0 },
                { label: "Easy", keep: 4.0, mile: 6.1 },
                { label: "Efficient", keep: 3.2, mile: 5.7 },
                { label: "Clear", keep: 3.1, mile: 6.0 },
                { label: "Exciting", keep: 3.9, mile: 6.0 },
                { label: "Interesting", keep: 3.6, mile: 5.7 },
                { label: "Inventive", keep: 3.4, mile: 6.1 },
                { label: "Leading Edge", keep: 3.1, mile: 6.0 }
            ]
        },
        imi: {
            label: "IMI",
            description: "Interest/enjoyment and value/usefulness indicators linked to intrinsic motivation.",
            items: [
                { label: "IE1", keep: 3.4, mile: 6.1 },
                { label: "IE2", keep: 3.0, mile: 5.9 },
                { label: "IE3", keep: 2.7, mile: 5.9 },
                { label: "IE4", keep: 3.4, mile: 5.7 },
                { label: "IE5", keep: 2.6, mile: 5.3 },
                { label: "VU1", keep: 4.1, mile: 6.3 },
                { label: "VU2", keep: 3.7, mile: 6.1 },
                { label: "VU3", keep: 4.1, mile: 6.0 },
                { label: "VU4", keep: 4.4, mile: 5.9 }
            ]
        }
    };
    let currentKey = "ueqs";
    let hasEnteredViewport = false;

    function formatNumber(value) {
        return value.toFixed(1);
    }

    function getPercent(value) {
        return Math.max(0, Math.min(100, (value / 7) * 100));
    }

    function getAverage(items, key) {
        const total = items.reduce(function (sum, item) {
            return sum + item[key];
        }, 0);

        return total / items.length;
    }

    function updateSummary(dataset) {
        const mileAverage = getAverage(dataset.items, "mile");
        const keepAverage = getAverage(dataset.items, "keep");
        const topItem = dataset.items.reduce(function (best, item) {
            return (item.mile - item.keep) > (best.mile - best.keep) ? item : best;
        });
        const averageGap = mileAverage - keepAverage;

        if (summaryValueMap.mileAverage) {
            summaryValueMap.mileAverage.textContent = formatNumber(mileAverage);
        }

        if (summaryNoteMap.mileAverage) {
            summaryNoteMap.mileAverage.textContent = dataset.label + " mean score across all displayed items";
        }

        if (summaryValueMap.averageGap) {
            summaryValueMap.averageGap.textContent = (averageGap >= 0 ? "+" : "") + formatNumber(averageGap);
        }

        if (summaryNoteMap.averageGap) {
            summaryNoteMap.averageGap.textContent = "Compared with Keep's " + formatNumber(keepAverage) + " average";
        }

        if (summaryValueMap.topDimension) {
            summaryValueMap.topDimension.textContent = topItem.label;
        }

        if (summaryNoteMap.topDimension) {
            summaryNoteMap.topDimension.textContent = "MileScape leads by " + formatNumber(topItem.mile - topItem.keep) + " points";
        }
    }

    function buildGroup(item) {
        const gap = item.mile - item.keep;
        const gapClass = gap >= 0 ? "is-positive" : "is-negative";
        const gapPrefix = gap >= 0 ? "+" : "";

        return [
            '<article class="eval-group">',
            '  <div class="eval-bar-pair">',
            '    <div class="eval-bar" style="--target-height: ', getPercent(item.keep), '%;">',
            '      <span class="eval-bar-value">', formatNumber(item.keep), '</span>',
            '      <span class="eval-bar-fill eval-bar-fill--keep" data-target-height="', getPercent(item.keep), '%"></span>',
            "    </div>",
            '    <div class="eval-bar" style="--target-height: ', getPercent(item.mile), '%;">',
            '      <span class="eval-bar-value">', formatNumber(item.mile), '</span>',
            '      <span class="eval-bar-fill eval-bar-fill--mile" data-target-height="', getPercent(item.mile), '%"></span>',
            "    </div>",
            "  </div>",
            '  <div class="eval-group-meta">',
            '      <div class="eval-group-label">', item.label, "</div>",
            '      <div class="eval-group-gap ', gapClass, '">MileScape ', gapPrefix, formatNumber(gap), "</div>",
            "  </div>",
            "</article>"
        ].join("");
    }

    function animateBars() {
        const fills = Array.from(chartRoot.querySelectorAll(".eval-bar-fill"));

        fills.forEach(function (fill) {
            fill.style.height = "0%";
        });

        window.requestAnimationFrame(function () {
            fills.forEach(function (fill, index) {
                const targetHeight = fill.getAttribute("data-target-height") || "0%";
                const delay = prefersReducedMotion.matches ? 0 : index * 28;

                window.setTimeout(function () {
                    fill.style.height = targetHeight;
                }, delay);
            });
        });
    }

    function render(nextKey) {
        const dataset = datasets[nextKey];

        if (!dataset || !barsContainer) {
            return;
        }

        currentKey = nextKey;
        buttons.forEach(function (button) {
            const isActive = button.getAttribute("data-eval-view") === nextKey;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        barsContainer.innerHTML = dataset.items.map(buildGroup).join("");
        barsContainer.setAttribute("aria-label", dataset.label + " comparison chart");

        if (caption) {
            caption.textContent = dataset.label + ": " + dataset.description;
        }

        updateSummary(dataset);

        if (hasEnteredViewport || prefersReducedMotion.matches) {
            animateBars();
        }
    }

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            const nextKey = button.getAttribute("data-eval-view");

            if (nextKey && nextKey !== currentKey) {
                render(nextKey);
            }
        });
    });

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && !hasEnteredViewport) {
                    hasEnteredViewport = true;
                    animateBars();
                    observer.disconnect();
                }
            });
        }, {
            threshold: 0.25
        });

        observer.observe(chartRoot);
    } else {
        hasEnteredViewport = true;
    }

    render(currentKey);
}());

(function () {
    const usageRoot = document.querySelector("[data-research-usage-chart]");
    const gapRoot = document.querySelector("[data-research-gap-chart]");
    const radarRoot = document.querySelector("[data-research-radar-chart]");
    const usageLegend = document.querySelector("[data-research-usage-legend]");
    const gapBars = document.querySelector("[data-research-gap-bars]");
    const radarSvg = document.querySelector("[data-research-radar-svg]");

    if (!usageRoot && !gapRoot && !radarRoot) {
        return;
    }

    const usageData = [
        { label: "Keep", value: 24, color: "#86c6c1" },
        { label: "Huawei Health", value: 13, color: "#ffbe73" },
        { label: "Nike Run Club", value: 11, color: "#79a8cf" },
        { label: "Apple Fitness", value: 9, color: "#ddcfc2" },
        { label: "Others", value: 43, color: "#b8b8b8" }
    ];
    const gapData = [
        { label: "Too focused on statistics", value: 75, color: "#b9b9b9" },
        { label: "Lack of fun / playful elements", value: 62, color: "#b3add8" },
        { label: "Repetitive experience", value: 62, color: "#7ca8cb" },
        { label: "Lack of meaningful rewards", value: 62, color: "#ffc078" },
        { label: "Too much competition and ranking", value: 50, color: "#86c6c1" }
    ];
    const radarData = [
        { label: "Rewards", value: 75 },
        { label: "Exploration", value: 75 },
        { label: "Game\nFeatures", value: 62.5 },
        { label: "Collection", value: 62.5 },
        { label: "Progress", value: 65 },
        { label: "Personal\nGoals", value: 45 },
        { label: "Blind\nBox", value: 72 },
        { label: "Social\nInteraction", value: 68 }
    ];
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function animateCount(el, target, duration) {
        if (prefersReducedMotion.matches) {
            el.textContent = target + "%";
            return;
        }
        var start = 0;
        var startTime = null;
        var isDecimal = target % 1 !== 0;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = start + (target - start) * eased;
            el.textContent = (isDecimal ? current.toFixed(1) : Math.round(current)) + "%";
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    function observeOnce(element, callback) {
        if (!element) {
            return;
        }

        if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
            callback();
            return;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    callback();
                    observer.disconnect();
                }
            });
        }, {
            threshold: 0.2
        });

        observer.observe(element);
    }

    if (usageRoot && usageLegend) {
        const donut = usageRoot.querySelector(".research-donut");
        const donutCenter = usageRoot.querySelector(".research-donut-center");
        const donutStrong = donutCenter ? donutCenter.querySelector("strong") : null;
        const donutStops = usageData.reduce(function (parts, item, index) {
            const start = usageData.slice(0, index).reduce(function (sum, current) {
                return sum + current.value;
            }, 0);
            const end = start + item.value;
            parts.push(item.color + " " + start + "% " + end + "%");
            return parts;
        }, []).join(", ");

        if (donut) {
            donut.style.setProperty("--donut-stops", donutStops);
        }

        usageLegend.innerHTML = usageData.map(function (item) {
            return [
                '<div class="research-legend-row">',
                '  <span class="research-legend-swatch" style="background:', item.color, ';"></span>',
                '  <span class="research-legend-label">', item.label, "</span>",
                '  <span class="research-legend-value">', item.value, "%</span>",
                "</div>"
            ].join("");
        }).join("");

        observeOnce(usageRoot, function () {
            usageRoot.classList.add("is-visible");
            if (donut) {
                donut.classList.add("is-visible");
            }

            if (donutCenter) {
                window.setTimeout(function () {
                    donutCenter.classList.add("is-visible");
                    if (donutStrong) {
                        animateCount(donutStrong, 24, 800);
                    }
                }, prefersReducedMotion.matches ? 0 : 400);
            }

            Array.from(usageLegend.querySelectorAll(".research-legend-row")).forEach(function (row, index) {
                window.setTimeout(function () {
                    row.classList.add("is-visible");
                }, prefersReducedMotion.matches ? 0 : 200 + index * 80);
            });
        });
    }

    if (gapRoot && gapBars) {
        gapBars.innerHTML = gapData.map(function (item) {
            return [
                '<article class="research-bar-row">',
                '  <div class="research-bar-head">',
                '    <span class="research-bar-label">', item.label, "</span>",
                '    <span class="research-bar-value" data-count-target="', item.value, '">', item.value, "%</span>",
                "  </div>",
                '  <div class="research-bar-track">',
                '    <div class="research-bar-fill" style="background:', item.color, '; --target-width:', item.value, '%;"></div>',
                "  </div>",
                "</article>"
            ].join("");
        }).join("");

        observeOnce(gapRoot, function () {
            gapRoot.classList.add("is-visible");
            var rows = Array.from(gapBars.querySelectorAll(".research-bar-row"));
            rows.forEach(function (row, index) {
                var delay = prefersReducedMotion.matches ? 0 : index * 100;
                window.setTimeout(function () {
                    row.classList.add("is-visible");
                    var bar = row.querySelector(".research-bar-fill");
                    if (bar) {
                        bar.classList.add("is-visible");
                    }
                    var valueEl = row.querySelector(".research-bar-value");
                    if (valueEl) {
                        var target = parseFloat(valueEl.getAttribute("data-count-target"));
                        animateCount(valueEl, target, 700);
                    }
                }, delay);
            });
        });
    }

    if (radarRoot && radarSvg) {
        const centerX = 260;
        const centerY = 220;
        const radius = 148;
        const levels = [25, 50, 75, 100];

        function pointFor(value, index, length) {
            const angle = (-Math.PI / 2) + (Math.PI * 2 * index / length);
            const scaledRadius = radius * (value / 100);
            return {
                x: centerX + Math.cos(angle) * scaledRadius,
                y: centerY + Math.sin(angle) * scaledRadius
            };
        }

        function polygonPoints(value, length) {
            return radarData.map(function (_, index) {
                const point = pointFor(value, index, length);
                return point.x.toFixed(2) + "," + point.y.toFixed(2);
            }).join(" ");
        }

        const gridMarkup = levels.map(function (level) {
            return '<polygon class="research-radar-grid" points="' + polygonPoints(level, radarData.length) + '"></polygon>';
        }).join("");

        const spokeMarkup = radarData.map(function (_, index) {
            const point = pointFor(100, index, radarData.length);
            return '<line class="research-radar-spoke" x1="' + centerX + '" y1="' + centerY + '" x2="' + point.x.toFixed(2) + '" y2="' + point.y.toFixed(2) + '"></line>';
        }).join("");

        const areaPoints = radarData.map(function (item, index) {
            const point = pointFor(item.value, index, radarData.length);
            return point.x.toFixed(2) + "," + point.y.toFixed(2);
        }).join(" ");

        const dotMarkup = radarData.map(function (item, index) {
            const point = pointFor(item.value, index, radarData.length);
            return '<circle class="research-radar-dot" cx="' + point.x.toFixed(2) + '" cy="' + point.y.toFixed(2) + '" r="5"></circle>';
        }).join("");

        const labelMarkup = radarData.map(function (item, index) {
            const point = pointFor(118, index, radarData.length);
            const valuePoint = pointFor(item.value + 10, index, radarData.length);
            const labelLines = item.label.split("\n");
            const textAnchor = point.x < centerX - 12 ? "end" : point.x > centerX + 12 ? "start" : "middle";
            const label = [
                '<text class="research-radar-label" x="' + point.x.toFixed(2) + '" y="' + point.y.toFixed(2) + '" text-anchor="' + textAnchor + '">'
            ];

            labelLines.forEach(function (line, lineIndex) {
                label.push('<tspan x="' + point.x.toFixed(2) + '" dy="' + (lineIndex === 0 ? 0 : 15) + '">' + line + "</tspan>");
            });

            label.push("</text>");
            label.push('<text class="research-radar-value" x="' + valuePoint.x.toFixed(2) + '" y="' + valuePoint.y.toFixed(2) + '" text-anchor="middle">' + item.value + "%</text>");
            return label.join("");
        }).join("");

        radarSvg.innerHTML = [
            '<g aria-hidden="true">', gridMarkup, spokeMarkup, "</g>",
            '<polygon class="research-radar-outline" points="', areaPoints, '"></polygon>',
            '<polygon class="research-radar-area" points="', areaPoints, '"></polygon>',
            dotMarkup,
            labelMarkup
        ].join("");

        observeOnce(radarRoot, function () {
            radarRoot.classList.add("is-visible");
            const outline = radarSvg.querySelector(".research-radar-outline");
            const area = radarSvg.querySelector(".research-radar-area");
            const dots = Array.from(radarSvg.querySelectorAll(".research-radar-dot"));

            if (outline) {
                var pathLength = outline.getTotalLength();
                outline.style.setProperty("--radar-path-length", pathLength);
                window.setTimeout(function () {
                    outline.classList.add("is-visible");
                }, prefersReducedMotion.matches ? 0 : 60);
            }

            if (area) {
                window.setTimeout(function () {
                    area.classList.add("is-visible");
                }, prefersReducedMotion.matches ? 0 : 300);
            }

            dots.forEach(function (dot, index) {
                window.setTimeout(function () {
                    dot.classList.add("is-visible");
                }, prefersReducedMotion.matches ? 0 : 400 + index * 60);
            });
        });
    }
}());

(function () {
    var nav = document.querySelector(".apple-nav");
    var svg = document.querySelector(".nav-progress-ring");
    if (!nav || !svg) return;

    var track = svg.querySelector(".nav-progress-track");
    var fill = svg.querySelector(".nav-progress-fill");
    if (!track || !fill) return;

    var pathLength = 0;

    function pillPath(w, h) {
        var r = h / 2;
        return "M " + r + " 0" +
            " L " + (w - r) + " 0" +
            " A " + r + " " + r + " 0 0 1 " + w + " " + r +
            " L " + w + " " + (h - r) +
            " A " + r + " " + r + " 0 0 1 " + (w - r) + " " + h +
            " L " + r + " " + h +
            " A " + r + " " + r + " 0 0 1 0 " + (h - r) +
            " L 0 " + r +
            " A " + r + " " + r + " 0 0 1 " + r + " 0 Z";
    }

    function syncSize() {
        var w = Math.round(nav.clientWidth);
        var h = Math.round(nav.clientHeight);

        if (!w || !h) {
            return;
        }

        svg.setAttribute("viewBox", "0 0 " + w + " " + h);
        var d = pillPath(w, h);
        track.setAttribute("d", d);
        fill.setAttribute("d", d);
        pathLength = fill.getTotalLength();
        track.style.strokeDasharray = pathLength;
        track.style.strokeDashoffset = 0;
        fill.style.strokeDasharray = pathLength;
        fill.style.strokeDashoffset = pathLength;
    }

    function updateProgress() {
        if (!pathLength) return;
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
        fill.style.strokeDashoffset = pathLength * (1 - progress);
    }

    var progressFrame = 0;

    function scheduleProgressUpdate() {
        if (progressFrame) {
            return;
        }

        progressFrame = window.requestAnimationFrame(function () {
            progressFrame = 0;
            updateProgress();
        });
    }

    syncSize();
    updateProgress();

    var resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            syncSize();
            updateProgress();
        }, 100);
    });

    if (typeof ResizeObserver === "function") {
        var navResizeObserver = new ResizeObserver(function () {
            syncSize();
            updateProgress();
        });
        navResizeObserver.observe(nav);
    }

    window.addEventListener("load", function () {
        syncSize();
        updateProgress();
    });
    window.addEventListener("scroll", scheduleProgressUpdate, { passive: true });
}());
