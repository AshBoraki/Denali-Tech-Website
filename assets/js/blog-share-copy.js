document.querySelectorAll("[data-copy-link]").forEach(function (button) {
    button.addEventListener("click", function () {
        var url = window.location.href;
        navigator.clipboard.writeText(url).then(function () {
            alert("Link copied to clipboard!");
        }).catch(function () {
            /* no-op */
        });
    });
});
