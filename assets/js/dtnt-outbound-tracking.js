(function () {
  function trackDtntOutbound(destinationUrl) {
    window.uetq = window.uetq || [];
    var payload = {
      event_category: 'Outbound click',
      event_label: 'dt-nt.com',
      event_value: '1',
      destination_url: destinationUrl,
      page_path: window.location.pathname
    };

    window.uetq.push('event', 'outbound_click', payload);
    window.uetq.push('event', 'dtnt_download_click', payload);
    window.uetq.push('event', 'DTNT Store Click', payload);
  }

  window.denaliTrackDtntOutbound = trackDtntOutbound;

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href*="dt-nt.com"]');

    if (!link) {
      return;
    }

    var destinationUrl = link.href;
    trackDtntOutbound(destinationUrl);

    if (link.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    window.setTimeout(function () {
      window.location.href = destinationUrl;
    }, 250);
  });
})();
