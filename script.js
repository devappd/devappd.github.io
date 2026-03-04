document.addEventListener('DOMContentLoaded', () => {
    const projects = document.querySelectorAll('.project-media');

    // Heuristic for mobile/metered network
    const isMetered = () => {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            // saveData is a good indicator, as is 'cellular' 2g/3g
            return conn.saveData || (conn.type === 'cellular' && (conn.effectiveType === '2g' || conn.effectiveType === '3g'));
        }
        // Fallback: If mobile-like touch support exists but no connection API,
        // or for older browsers, we can't reliably know, so default to carousel for safe-load.
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };

    const metered = isMetered();

    projects.forEach(media => {
        const detailUrl = media.dataset.detail;
        if (!detailUrl) return; // Static image only, no carousel logic

        const detailImg = media.querySelector('.project-detail-img');

        if (metered) {
            media.classList.add('carousel-mode');
            setupCarousel(media, detailImg, detailUrl);
        } else {
            // Standard lazy load
            lazyLoadImage(media, detailImg, detailUrl);
        }
    });

    function lazyLoadImage(container, img, url) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(container, img, url);
                    observer.unobserve(container);
                }
            });
        }, { rootMargin: '200px' });

        observer.observe(container);
    }

    function loadImage(container, img, url) {
        if (img.getAttribute('src')) return;

        container.classList.add('loading');
        img.src = url;
        img.onload = () => {
            container.classList.remove('loading');
            img.classList.add('loaded');
            container.classList.add('detail-active');
        };
    }

    function setupCarousel(container, img, url) {
        const nextBtn = container.querySelector('.carousel-btn.next');
        const prevBtn = container.querySelector('.carousel-btn.prev');
        const thumbnail = container.querySelector('.project-thumbnail');
        let detailLoaded = false;

        const toggleDetail = () => {
            if (!detailLoaded) {
                loadImage(container, img, url);
                detailLoaded = true;
            } else {
                img.classList.toggle('loaded');
            }
        };

        // Click listeners
        [nextBtn, prevBtn].forEach(el => {
            if (el) el.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDetail();
            });
        });

        // Refined Swipe detection with visual feedback
        let startX = 0;
        let startY = 0;
        let deltaX = 0;
        let deltaY = 0;
        let isScrolling = false;
        let isSwiping = false;

        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isScrolling = false;
            isSwiping = false;
            deltaX = 0;

            // Disable transitions for real-time tracking
            [img, thumbnail].forEach(el => {
                if (el) el.style.transition = 'none';
            });
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (isScrolling) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            deltaX = touchX - startX;
            deltaY = touchY - startY;

            // Determine if user is swiping horizontally or scrolling vertically
            if (!isSwiping) {
                if (Math.abs(deltaY) > Math.abs(deltaX)) {
                    isScrolling = true;
                    return;
                } else if (Math.abs(deltaX) > 10) {
                    isSwiping = true;
                }
            }

            if (isSwiping) {
                // Prevent vertical scroll while swiping
                if (e.cancelable) e.preventDefault();

                // Visual feedback: slide the active image
                const activeImg = img.classList.contains('loaded') ? img : thumbnail;
                if (activeImg) {
                    activeImg.style.transform = `translateX(${deltaX}px)`;
                }
            }
        }, { passive: false });

        container.addEventListener('touchend', () => {
            // Re-enable transitions
            [img, thumbnail].forEach(el => {
                if (el) el.style.transition = '';
            });

            if (isSwiping) {
                const threshold = 60;
                if (Math.abs(deltaX) > threshold) {
                    toggleDetail();
                }
            }

            // Snap back
            [img, thumbnail].forEach(el => {
                if (el) el.style.transform = '';
            });

            isSwiping = false;
            isScrolling = false;
        }, { passive: true });
    }
});