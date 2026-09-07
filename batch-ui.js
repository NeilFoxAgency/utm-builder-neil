(function () {
  'use strict';
  const input = document.getElementById('intake');
  const output = document.getElementById('result');
  const status = document.getElementById('status');
  const download = document.getElementById('download');
  const exportIntake = document.getElementById('export-intake');
  const copy = document.getElementById('copy');
  let current = null;
  function clear() {
    current = null;
    output.textContent = '';
    download.disabled = exportIntake.disabled = copy.disabled = true;
    status.textContent = 'Not prepared. Nothing has been sent or saved.';
  }
  input.addEventListener('input', clear);
  document.getElementById('prepare').addEventListener('click', function () {
    clear();
    try {
      if (input.value.length > 1000000) throw new Error('Input exceeds 1 MB.');
      const data = JSON.parse(input.value);
      const result = NfaBatch.prepare(data);
      current = {data, result};
      output.textContent = JSON.stringify(result, null, 2);
      download.disabled = exportIntake.disabled = copy.disabled = false;
      status.textContent = 'Prepared ' + result.placements.length + ' draft requests. No live links were created.';
    } catch (error) { status.textContent = error.message; }
  });
  function save(value, filename) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + '\n'], {type:'application/json'}));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  download.addEventListener('click', () => { if (current) save(current.result, 'draft-link-requests.json'); });
  exportIntake.addEventListener('click', () => { if (current) save(current.data, 'campaign-intake.json'); });
  copy.addEventListener('click', async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(current.result, null, 2));
      status.textContent = 'Copied draft requests. No links were provisioned.';
    } catch (_) { status.textContent = 'Clipboard unavailable. Use Download requests or select the output.'; }
  });
  clear();
})();
