document.addEventListener("DOMContentLoaded", function () {
    const backToTopBtn = document.getElementById("backToTopBtn");

    if (backToTopBtn) {
        // Smoothly return window viewport to page baseline zero coordinates
        backToTopBtn.addEventListener("click", function () {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
        
        // Listen to window scroll metrics to fade the button in/out cleanly
        window.addEventListener("scroll", function () {
            if (window.scrollY > 250) {
                backToTopBtn.style.opacity = "1";
                backToTopBtn.style.pointerEvents = "all";
                backToTopBtn.style.transform = "scale(1)";
            } else {
                backToTopBtn.style.opacity = "0";
                backToTopBtn.style.pointerEvents = "none";
                backToTopBtn.style.transform = "scale(0.8)";
            }
        });
    }
});